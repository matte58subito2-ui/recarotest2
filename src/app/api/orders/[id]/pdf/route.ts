import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  const guestCookie = cookies().get('guest_lead');

  // We allow access if session exists, OR if it's a guest with a valid cookie
  if (!session && !guestCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const orderRes = await db.execute({
    sql: 'SELECT * FROM orders WHERE id = ?',
    args: [Number(params.id)]
  });
  const order = orderRes.rows[0];
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // If no session but there's a guest cookie, make sure this order is actually a guest order
  if (!session && order.user_id !== null) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const config = JSON.parse(order.config_json as string);

  // Generate HTML for PDF (client will print)
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Order ${order.order_number as string}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: #fff; color: #1a1a1a; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 30px; border-bottom: 3px solid #c41e1e; margin-bottom: 30px; }
    .brand { font-size: 36px; font-weight: 900; letter-spacing: 6px; color: #c41e1e; }
    .brand span { color: #1a1a1a; }
    .meta { text-align: right; font-size: 13px; color: #555; }
    h2 { font-size: 20px; margin-bottom: 16px; color: #c41e1e; text-transform: uppercase; letter-spacing: 2px; }
    .section { margin-bottom: 28px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    td { padding: 10px 14px; border-bottom: 1px solid #eee; }
    td:first-child { font-weight: bold; width: 200px; color: #555; }
    .total-row td { font-size: 18px; font-weight: bold; color: #c41e1e; border-top: 2px solid #c41e1e; border-bottom: 2px solid #c41e1e; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; background: #f0f0f0; color: #555; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <img src="https://it.recaro-automotive.com/typo3conf/ext/wc_recaro_site/Resources/Public/img/recaro_logo.png" alt="RECARO" style="width: 200px; display: block;" />
      <div style="font-size:12px; color:#888; margin-top:8px;">B2B Platform — Configured Order</div>
    </div>
    <div class="meta">
      <div><strong>Order No:</strong> ${order.order_number as string}</div>
      <div><strong>Date:</strong> ${new Date(order.created_at as string).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
      <div style="margin-top:8px"><span class="badge">${order.status as string}</span></div>
    </div>
  </div>

  ${config.guestLead ? `
  <div class="section">
    <h2>Guest Information</h2>
    <table>
      <tr><td>Company Name</td><td>${config.guestLead.companyName || '—'}</td></tr>
      <tr><td>VAT</td><td>${config.guestLead.vat || '—'}</td></tr>
      <tr><td>Address</td><td>${config.guestLead.address || '—'}</td></tr>
      <tr><td>Email</td><td>${config.guestLead.email || '—'}</td></tr>
    </table>
  </div>
  ` : ''}

  <div class="section">
    <h2>Seat Configuration</h2>
    <table>
      <tr><td>Model</td><td>${config.seatName || '—'}</td></tr>
      <tr><td>Category</td><td>${config.category || '—'}</td></tr>
      <tr><td>Material</td><td>${config.material || '—'}</td></tr>
      <tr><td>Color</td><td>${config.color || '—'}</td></tr>
      <tr><td>Heating</td><td>${config.heating ? '✅ Included' : '❌ Not included'}</td></tr>
    </table>
  </div>

  <div class="section">
    <h2>Logo Customization</h2>
    <table>
      <tr><td>Backrest</td><td>${config.logos?.schienale ? '✅ Logo applied' : '—'}</td></tr>
      <tr><td>Headrest</td><td>${config.logos?.poggiatesta ? '✅ Logo applied' : '—'}</td></tr>
      <tr><td>Seat Back</td><td>${config.logos?.retroSedile ? '✅ Logo applied' : '—'}</td></tr>
      <tr><td>Bolsters</td><td>${config.logos?.fianchetti ? '✅ Logo applied' : '—'}</td></tr>
    </table>
  </div>

  ${config.accessories && config.accessories.length > 0 ? `
  <div class="section">
    <h2>Selected Accessories</h2>
    <table>
      ${config.accessories.map((a: string) => `<tr><td colspan="2">• ${a}</td></tr>`).join('')}
    </table>
  </div>
  ` : ''}

  <div class="section">
    <h2>Economic Summary</h2>
    <table>
      <tr><td>Base Seat Price</td><td>€ ${(config.basePrice || 0).toFixed(2)}</td></tr>
      <tr><td>Material (${config.material})</td><td>€ ${(config.materialPriceDelta || 0).toFixed(2)}</td></tr>
      ${config.heating ? `<tr><td>Heating</td><td>€ ${(config.heatingCost || 0).toFixed(2)}</td></tr>` : ''}
      ${(config.accessoriesTotal || 0) > 0 ? `<tr><td>Accessories</td><td>€ ${(config.accessoriesTotal || 0).toFixed(2)}</td></tr>` : ''}
      <tr class="total-row"><td>TOTAL</td><td>€ ${Number(order.total_price || 0).toFixed(2)}</td></tr>
    </table>
  </div>

  <div class="footer">
    RECARO B2B Platform — Document automatically generated on ${new Date().toLocaleDateString('en-US')} — To be sent to the customer and ERP to process the order
  </div>

  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
