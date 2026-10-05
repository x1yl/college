// Vercel serverless function: looks a college up in the U.S. Dept. of Education
// College Scorecard API (built on IPEDS) and returns fields shaped for the tracker.
// Set SCORECARD_API_KEY in Vercel (free key: https://api.data.gov/signup). Falls back to DEMO_KEY (rate-limited).
const P = {
  size: "latest.student.size",
  admit: "latest.admissions.admission_rate.overall",
  m25: "latest.admissions.sat_scores.25th_percentile.math",
  r25: "latest.admissions.sat_scores.25th_percentile.critical_reading",
  m75: "latest.admissions.sat_scores.75th_percentile.math",
  r75: "latest.admissions.sat_scores.75th_percentile.critical_reading",
  a25: "latest.admissions.act_scores.25th_percentile.cumulative",
  a75: "latest.admissions.act_scores.75th_percentile.cumulative",
  tin: "latest.cost.tuition.in_state",
  tout: "latest.cost.tuition.out_of_state",
  room: "latest.cost.roomboard.oncampus",
  coa: "latest.cost.attendance.academic_year",
  net: "latest.cost.avg_net_price.overall",
  grad: "latest.completion.completion_rate_4yr_150nt",
  ret: "latest.student.retention_rate.four_year.full_time",
  debt: "latest.aid.median_debt.completers.overall",
  pell: "latest.aid.pell_grant_rate",
};
const FIELDS = [
  "id",
  "school.name",
  "school.city",
  "school.state",
  "school.school_url",
  "school.ownership",
  "school.locale",
  ...Object.values(P),
];
const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

module.exports = async (req, res) => {
  const name = String(req.query.name || "").trim();
  if (!name) return res.status(400).json({ error: "name required" });
  const key = process.env.SCORECARD_API_KEY || "DEMO_KEY";
  const url = (extra) =>
    `https://api.data.gov/ed/collegescorecard/v1/schools.json?api_key=${key}&school.name=${encodeURIComponent(name)}&per_page=10&sort=latest.student.size:desc${extra}`;
  try {
    let r = await fetch(url("&fields=" + FIELDS.join(",")));
    if (!r.ok) r = await fetch(url("")); // if a field name was rejected, retry with the full record
    if (!r.ok)
      return res.status(502).json({ error: "Scorecard error " + r.status });
    const list = (await r.json()).results || [];
    const o =
      list.find(
        (x) => norm(x["school.name"] ?? x.school?.name) === norm(name),
      ) || list[0];
    if (!o) return res.status(404).json({ error: "not found" });
    const v = (p) => {
      let x = o[p];
      if (x === undefined) x = p.split(".").reduce((a, k) => a && a[k], o);
      return x == null ? undefined : x;
    };
    const d = {},
      set = (k, x) => {
        if (x != null && !Number.isNaN(x)) d[k] = x;
      };
    const pct = (x, n = 0) => (x == null ? undefined : +(x * 100).toFixed(n));
    const sum = (a, b) => (a != null && b != null ? a + b : undefined);
    set("admit", pct(v(P.admit), 1));
    set("size", v(P.size));
    set("sat25", sum(v(P.m25), v(P.r25)));
    set("sat75", sum(v(P.m75), v(P.r75)));
    set("act25", v(P.a25));
    set("act75", v(P.a75));
    set("room", v(P.room));
    // NY residents: show in-state for public NY schools, out-of-state for public schools elsewhere; privates charge everyone the same.
    const s0 = v("school.state"),
      pub = v("school.ownership") === 1,
      tin = v(P.tin),
      tout = v(P.tout),
      att = v(P.coa),
      out = pub && s0 !== "NY";
    set("tuition", out ? tout : tin);
    set(
      "res",
      pub ? (out ? "Out-of-state" : "NY in-state") : "Same for all (private)",
    );
    set(
      "coa",
      out && att != null && tin != null && tout != null
        ? att - tin + tout
        : att,
    );
    if (!out) set("net", v(P.net)); // Scorecard net price is based on in-state students, so it is skipped for out-of-state publics
    set("debt", v(P.debt));
    set("pell", pct(v(P.pell)));
    set("grad", pct(v(P.grad)));
    set("ret", pct(v(P.ret)));
    const own = v("school.ownership");
    if (own) d.type = own === 1 ? "Public" : "Private";
    const loc = v("school.locale");
    if (loc)
      d.setting = { 1: "City", 2: "Suburb", 3: "Town", 4: "Rural" }[
        Math.floor(loc / 10)
      ];
    const city = v("school.city"),
      stt = v("school.state");
    if (city) d.loc = stt ? `${city}, ${stt}` : city;
    let site = v("school.school_url");
    if (site) d.url = /^https?:/.test(site) ? site : "https://" + site;
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");
    res.json({ id: v("id"), name: v("school.name"), d });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
};
