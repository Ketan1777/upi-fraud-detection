import csv
import random
import datetime
import os

OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "transactions.csv")

# Realistic UPI handles
POPULAR_BANKS = ["oksbi", "okhdfcbank", "okaxis", "okicici", "ybl", "paytm", "apl"]
FIRST_NAMES = [
    "aarav", "rohit", "priya", "ananya", "vikram", "rahul", "sneha", "amit", 
    "deepak", "pooja", "varun", "kavita", "manish", "sunita", "neha", "rajesh",
    "aditya", "shreya", "suresh", "kiran", "alok", "tanvi", "tarun", "meera"
]

MERCHANTS = [
    "swiggy.pay@icici", "zomato.order@hdfc", "amazon.upi@axis", "flipkart.pay@sbi",
    "uber.india@ybl", "ola.cabs@paytm", "zepto.groceries@icici", "blinkit.retail@hdfc",
    "airtel.bill@sbi", "jio.recharge@axis", "cred.club@paytm", "bigbasket.store@icici"
]

MULE_ACCOUNTS = [
    "mule.cashout.01@paytm", "shadow.crypto.ramp@ybl", "agent.collector.hub@oksbi",
    "fast.exchange.node@okaxis", "crypto.p2p.clearing@okicici", "rapid.funnel.fund@ybl"
]

CATEGORIES = ["P2P", "P2M", "BILL_PAYMENT", "INVESTMENT", "E_COMMERCE"]
PAYMENT_METHODS = ["GOOGLE_PAY", "PHONEPE", "PAYTM", "BHIM", "CRED"]


def generate_upi_id(name=None):
    if not name:
        name = random.choice(FIRST_NAMES)
    handle = random.choice(POPULAR_BANKS)
    suffix = random.randint(10, 999)
    return f"{name}{suffix}@{handle}"


def generate_dataset(num_records=1500):
    records = []
    
    # Pre-generate user base
    users = [generate_upi_id() for _ in range(60)]
    user_avg_amounts = {u: random.randint(300, 3500) for u in users}

    base_time = datetime.datetime(2026, 10, 15, 8, 0, 0)
    current_time = base_time

    for i in range(1, num_records + 1):
        txn_id = f"UPI{current_time.strftime('%Y%m%d%H%M%S')}{i:04d}"
        
        # Decide scenario type:
        # 1. Normal retail / P2P (75%)
        # 2. Velocity spike / rapid fraud (8%)
        # 3. Money Mule consolidation funnel (7%)
        # 4. Sudden high-value anomaly / Account takeover (6%)
        # 5. Nocturnal off-hour drain (4%)
        scenario_roll = random.random()

        if scenario_roll < 0.75:
            # NORMAL TRANSACTION
            sender = random.choice(users)
            if random.random() < 0.45:
                receiver = random.choice(MERCHANTS)
                category = random.choice(["P2M", "BILL_PAYMENT", "E_COMMERCE"])
            else:
                receiver = random.choice(users)
                while receiver == sender:
                    receiver = random.choice(users)
                category = "P2P"

            avg_amt = user_avg_amounts[sender]
            amount = round(random.uniform(0.3 * avg_amt, 1.8 * avg_amt), 2)
            amount = max(10.0, min(amount, 15000.0))

            hour = random.choice([8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22])
            txns_last_5m = random.choice([1, 1, 1, 2])
            is_new_rcv = 1 if random.random() < 0.25 else 0
            fan_in = random.randint(1, 2)
            is_emulator = 0
            seconds_last = random.randint(120, 7200)
            amt_ratio = round(amount / avg_amt, 2)

            fraud_label = 0
            risk_score = round(random.uniform(4.0, 24.0), 1)
            classification = "SAFE"
            status = "COMPLETED"
            is_flagged = False

        elif scenario_roll < 0.83:
            # VELOCITY SPIKE (Burst of transactions in <5 minutes)
            sender = random.choice(users)
            receiver = random.choice(users)
            amount = round(random.uniform(4000.0, 15000.0), 2)
            hour = random.choice([10, 14, 16, 19, 21])
            txns_last_5m = random.randint(4, 9)
            is_new_rcv = 1
            fan_in = random.randint(1, 3)
            is_emulator = 1 if random.random() < 0.5 else 0
            seconds_last = random.randint(5, 45)
            amt_ratio = round(amount / user_avg_amounts[sender], 2)
            category = "P2P"

            fraud_label = 1
            risk_score = round(random.uniform(72.0, 94.0), 1)
            classification = "FRAUDULENT"
            status = "BLOCKED"
            is_flagged = True

        elif scenario_roll < 0.90:
            # MONEY MULE FUNNEL (Multiple victims sending funds into one collector hub)
            sender = random.choice(users)
            receiver = random.choice(MULE_ACCOUNTS)
            amount = round(random.uniform(15000.0, 50000.0), 2)
            hour = random.randint(0, 23)
            txns_last_5m = random.randint(1, 3)
            is_new_rcv = 1
            fan_in = random.randint(5, 14)
            is_emulator = 0
            seconds_last = random.randint(30, 600)
            amt_ratio = round(amount / user_avg_amounts[sender], 2)
            category = "INVESTMENT"

            fraud_label = 1
            risk_score = round(random.uniform(75.0, 98.0), 1)
            classification = "FRAUDULENT"
            status = "BLOCKED"
            is_flagged = True

        elif scenario_roll < 0.96:
            # SUDDEN HIGH-VALUE SPIKE / ACCOUNT TAKEOVER
            sender = random.choice(users)
            receiver = random.choice(users)
            avg_amt = user_avg_amounts[sender]
            amount = round(random.uniform(45000.0, 99000.0), 2)
            hour = random.choice([2, 3, 4, 13, 23])
            txns_last_5m = random.randint(2, 4)
            is_new_rcv = 1
            fan_in = random.randint(1, 2)
            is_emulator = 1
            seconds_last = random.randint(15, 180)
            amt_ratio = round(amount / avg_amt, 2)
            category = "P2P"

            fraud_label = 1
            risk_score = round(random.uniform(78.0, 96.0), 1)
            classification = "FRAUDULENT"
            status = "BLOCKED"
            is_flagged = True

        else:
            # BORDERLINE SUSPICIOUS (Review recommended)
            sender = random.choice(users)
            receiver = random.choice(users)
            avg_amt = user_avg_amounts[sender]
            amount = round(random.uniform(12000.0, 28000.0), 2)
            hour = random.choice([1, 2, 5, 23])
            txns_last_5m = 3
            is_new_rcv = 1
            fan_in = 3
            is_emulator = 0
            seconds_last = random.randint(90, 400)
            amt_ratio = round(amount / avg_amt, 2)
            category = "P2P"

            fraud_label = 0  # Treated as suspicious/borderline
            risk_score = round(random.uniform(35.0, 68.0), 1)
            classification = "SUSPICIOUS"
            status = "FLAG_REVIEW"
            is_flagged = True

        # Advance timestamp slightly
        current_time += datetime.timedelta(seconds=random.randint(20, 240))
        txn_timestamp = current_time.replace(hour=hour).strftime("%Y-%m-%d %H:%M:%S")

        method = random.choice(PAYMENT_METHODS)

        records.append({
            "txn_id": txn_id,
            "sender_upi": sender,
            "receiver_upi": receiver,
            "amount": amount,
            "payment_method": method,
            "category": category,
            "timestamp": txn_timestamp,
            "status": status,
            "risk_score": risk_score,
            "classification": classification,
            "is_flagged": is_flagged,
            "fraud_label": fraud_label,
            "hour_of_day": hour,
            "txns_last_5m": txns_last_5m,
            "amt_to_avg_ratio": amt_ratio,
            "is_new_receiver": is_new_rcv,
            "receiver_fan_in_1h": fan_in,
            "is_emulator": is_emulator,
            "seconds_since_last": seconds_last,
        })

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(records[0].keys()))
        writer.writeheader()
        writer.writerows(records)

    print(f"Generated {len(records)} realistic UPI transactions in {OUTPUT_FILE}")
    return records


if __name__ == "__main__":
    generate_dataset(1500)
