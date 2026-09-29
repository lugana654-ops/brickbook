export function formatVehicleNumber(val: string): string {
  if (!val) return "";
  // Strip non-alphanumeric characters and convert to upper case
  const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length === 0) return "";

  // 1. State Code (e.g. KL)
  const state = clean.slice(0, 2);
  if (clean.length <= 2) return state;

  const rest = clean.slice(2);

  // 2. District / RTO Code (1 or 2 digits, e.g. 07 or 7)
  const rtoMatch = rest.match(/^([0-9]{1,2})/);
  if (!rtoMatch) {
    return `${state}-${rest.slice(0, 8)}`;
  }

  const rto = rtoMatch[1];
  const afterRto = rest.slice(rto.length);
  if (!afterRto) {
    return `${state}-${rto}`;
  }

  // 3. Series (1 or 2 letters, e.g. A, AB) OR directly digits
  const seriesMatch = afterRto.match(/^([A-Z]{1,2})/);
  if (!seriesMatch) {
    const digitsOnly = afterRto.replace(/[^0-9]/g, "").slice(0, 4);
    return `${state}-${rto}-${digitsOnly}`;
  }

  const series = seriesMatch[1];
  const afterSeries = afterRto.slice(series.length);
  if (!afterSeries) {
    return `${state}-${rto}-${series}`;
  }

  // 4. Vehicle Number (1 to 4 digits, e.g. 1234, 5070)
  const numberPart = afterSeries.replace(/[^0-9]/g, "").slice(0, 4);
  return `${state}-${rto}-${series}-${numberPart}`;
}
