from typing import Dict, Any, List
from collections import defaultdict
from sqlalchemy.orm import Session
from backend.app.models.models import Transaction, Account


class NetworkAnalysisService:
    """
    Analyzes transaction topologies to detect:
    - Money Mule Hubs (fan-in from many victim senders)
    - Laundering chains & circular payments
    - High-risk clusters
    """

    @classmethod
    def analyze_network(cls, db: Session, limit: int = 150) -> Dict[str, Any]:
        # Fetch recent transactions
        txns = (
            db.query(Transaction)
            .order_by(Transaction.timestamp.desc())
            .limit(limit)
            .all()
        )

        in_degree = defaultdict(set)
        out_degree = defaultdict(set)
        node_received_amt = defaultdict(float)
        node_sent_amt = defaultdict(float)
        node_txn_counts = defaultdict(int)
        node_max_risk = defaultdict(float)
        edges_map = defaultdict(lambda: {"amount": 0.0, "count": 0, "max_risk": 0.0})

        for t in txns:
            sender = t.sender_upi
            receiver = t.receiver_upi
            amt = t.amount
            risk = t.risk_score or 0.0

            in_degree[receiver].add(sender)
            out_degree[sender].add(receiver)

            node_received_amt[receiver] += amt
            node_sent_amt[sender] += amt
            node_txn_counts[sender] += 1
            node_txn_counts[receiver] += 1

            node_max_risk[sender] = max(node_max_risk[sender], risk)
            node_max_risk[receiver] = max(node_max_risk[receiver], risk)

            edge_key = (sender, receiver)
            edges_map[edge_key]["amount"] += amt
            edges_map[edge_key]["count"] += 1
            edges_map[edge_key]["max_risk"] = max(edges_map[edge_key]["max_risk"], risk)

        # Classify nodes
        nodes = []
        all_accounts = set(list(in_degree.keys()) + list(out_degree.keys()))
        mule_count = 0

        for upi_id in all_accounts:
            payers_count = len(in_degree[upi_id])
            payees_count = len(out_degree[upi_id])
            risk = node_max_risk[upi_id]
            is_mule = False
            node_type = "regular"

            # Money mule criteria: receiver with 4+ unique senders and high risk, or flagged in DB
            if payers_count >= 3 and risk >= 60.0:
                is_mule = True
                node_type = "mule_hub"
                mule_count += 1
            elif "mule" in upi_id.lower() or "shadow" in upi_id.lower() or "crypto" in upi_id.lower():
                is_mule = True
                node_type = "mule_hub"
                mule_count += 1
            elif payers_count > payees_count:
                node_type = "receiver"
            else:
                node_type = "sender"

            nodes.append({
                "id": upi_id,
                "label": upi_id.split("@")[0],
                "upi_id": upi_id,
                "risk_score": round(risk, 1),
                "is_mule": is_mule,
                "node_type": node_type,
                "total_sent": round(node_sent_amt[upi_id], 2),
                "total_received": round(node_received_amt[upi_id], 2),
                "txn_count": node_txn_counts[upi_id],
                "in_degree": payers_count,
                "out_degree": payees_count,
            })

        # Format edges
        edges = []
        high_risk_connections = 0
        for (src, tgt), meta in edges_map.items():
            is_suspicious = meta["max_risk"] >= 50.0
            if is_suspicious:
                high_risk_connections += 1

            edges.append({
                "source": src,
                "target": tgt,
                "amount": round(meta["amount"], 2),
                "txn_count": meta["count"],
                "risk_score": round(meta["max_risk"], 1),
                "is_suspicious": is_suspicious,
            })

        return {
            "nodes": nodes,
            "edges": edges,
            "mule_clusters_count": mule_count,
            "high_risk_connections": high_risk_connections,
            "total_analyzed_nodes": len(nodes),
            "total_analyzed_edges": len(edges),
        }
