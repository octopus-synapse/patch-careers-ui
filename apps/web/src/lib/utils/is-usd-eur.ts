/**
 * Heuristic to decide whether a job is paying in hard currency (USD/EUR)
 * based on the free-form `salaryRange` field currently used by the API.
 *
 * When the backend adds a structured `paymentCurrency` field this helper
 * should accept it as the primary signal and keep the string check as fallback.
 */
export function isUsdEurJob(job: {
  salaryRange?: string;
  paymentCurrency?: string;
  location?: string;
  jobType?: string;
}): boolean {
  if (job.paymentCurrency) {
    const normalized = job.paymentCurrency.toUpperCase();
    if (normalized === 'USD' || normalized === 'EUR') return true;
  }

  const salary = (job.salaryRange ?? '').trim();
  if (!salary) return false;

  // Reais come with the "R$" prefix in virtually every Brazilian listing we've
  // seen — strip those mentions before checking for bare currency signals.
  const stripped = salary.replace(/R\$/gi, '');
  return (
    /USD|EUR|US\$|€|GBP|£/i.test(stripped) ||
    // Bare "$" without an "R" nearby typically means USD in BR listings.
    (/\$/.test(stripped) && !/R\$/i.test(salary))
  );
}
