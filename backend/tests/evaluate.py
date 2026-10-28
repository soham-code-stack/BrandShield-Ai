"""Precision / Recall on a small labelled set (rule ids expected per draft)."""
from app.engine import analyze
SET = [
 ("BUY NOW! GET 70% OFF! Our cream is guaranteed to cure every skin problem.", {"R1","R2","R3"}),
 ("Enjoy 15% off our new moisturiser. Gentle, daily hydration.", set()),
 ("Our whitening serum is cheap and gives instant results.", {"R3","R4"}),
 ("Save 50% this weekend on all creams.", {"R1"}),
 ("Dermatologist-approved formula that treats acne.", {"R2"}),
 ("Hydrating cream for dry skin. Warm, honest care.", set()),
]
tp = fp = fn = 0
for text, exp in SET:
    got = {f["rule_id"] for f in analyze(text)}
    tp += len(got & exp); fp += len(got - exp); fn += len(exp - got)
p, r = tp / (tp + fp or 1), tp / (tp + fn or 1)
print(f"precision={p:.2f} recall={r:.2f} (tp={tp} fp={fp} fn={fn})")
