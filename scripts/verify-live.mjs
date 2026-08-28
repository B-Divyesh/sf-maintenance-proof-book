const product = 'maintenance-proof-book';
const api = `https://api.sociobot.in/api/v1/products/${product}`;

const catalogResponse = await fetch('https://api.sociobot.in/api/v1/products', { headers: { accept: 'application/json' } });
if (!catalogResponse.ok) throw new Error(`Product catalog returned HTTP ${catalogResponse.status}.`);
const catalog = await catalogResponse.json();
const listed = Array.isArray(catalog.data) && catalog.data.find((item) => item?.slug === product);
if (!listed || listed.price_minor !== 2400 || listed.currency !== 'USD') {
  throw new Error('Maintenance Proof Book is not registered as the expected $24 USD factory product.');
}

const checkout = await fetch(`${api}/checkout`, { method: 'HEAD', redirect: 'manual' });
const destination = checkout.headers.get('location');
if (![301, 302, 303, 307, 308].includes(checkout.status) || !destination?.startsWith('https://')) {
  throw new Error(`Checkout is not a hosted redirect (HTTP ${checkout.status}).`);
}

const verify = await fetch(`${api}/verify?license=invalid-regression-token`, { headers: { origin: 'https://maintenance-proof-book.sociobot.in' } });
const verdict = await verify.json();
if (!verify.ok || verdict.valid !== false || verdict.reason !== 'invalid') {
  throw new Error('License verification contract did not return the expected invalid verdict.');
}

console.log(JSON.stringify({ product: listed.slug, checkoutStatus: checkout.status, checkoutHost: new URL(destination).host, verification: verdict.reason }));
