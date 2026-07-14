/**
 * Cashfree Checkout integration (SDK v3).
 * Server creates the order and returns paymentSessionId; SDK opens the checkout.
 */
async function buyPlan(planCode) {
  try {
    const r = await fetch('/payment/create', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planCode })
    });
    const j = await r.json();
    if (!j.success) throw new Error(j.error || 'Failed');
    const mode = (j.env || 'PROD').toUpperCase() === 'PROD' ? 'production' : 'sandbox';
    const cashfree = window.Cashfree ? Cashfree({ mode }) : null;
    if (!cashfree) throw new Error('Cashfree SDK failed to load');
    await cashfree.checkout({
      paymentSessionId: j.paymentSessionId,
      redirectTarget: '_self'
    });
  } catch (e) {
    alert('Payment error: ' + e.message);
  }
}
window.buyPlan = buyPlan;
