const STAT = [
  "Not started",
  "Started",
  "Submitted",
  "Waitlisted",
  "Accepted",
  "Admitted",
  "Rejected",
];
const CK = [
  "Common App / school app",
  "Personal statement",
  "Supplemental essays",
  "Recommendation letters",
  "Official transcript",
  "SAT/ACT scores sent",
  "FAFSA",
  "CSS Profile",
  "Application fee / waiver",
  "Interview",
  "Portfolio / extras",
];
const G = {
  "Your school cohort (Overgrad)": [
    ["cohortApps", "Applicants from your school", "n"],
    ["cohortAdmit", "Admit rate % (your school)", "n"],
    ["cohortEnr", "Admitted & enrolled", "n"],
    ["cohortAvgGpa", "Avg GPA of admits", "n"],
    ["cohortAvgSat", "Avg SAT of admits", "n"],
    ["cohortSat25", "SAT 25th (your school)", "n"],
    ["cohortSat75", "SAT 75th (your school)", "n"],
    ["cohortGpa25", "GPA 25th (your school)", "n"],
    ["cohortGpa75", "GPA 75th (your school)", "n"],
  ],
  Admissions: [
    ["admit", "Admit rate %", "n"],
    ["apps", "Applicants", "n"],
    ["admitted", "Admitted", "n"],
    ["enr", "Enrolled students", "n"],
    ["sat25", "SAT 25th", "n"],
    ["sat75", "SAT 75th", "n"],
    ["act25", "ACT 25th", "n"],
    ["act75", "ACT 75th", "n"],
    ["gpa", "GPA 50th (median)", "n"],
    ["gpa25", "GPA 25th", "n"],
    ["gpa75", "GPA 75th", "n"],
    ["testpol", "Test policy", "t"],
  ],
  "Cost & affordability": [
    ["tuition", "Tuition & fees $ (NY resident)", "n"],
    ["res", "Tuition rate shown", "t"],
    ["room", "Room & board $", "n"],
    ["books", "Books & misc $", "n"],
    ["coa", "Total cost of attendance $", "n"],
    ["aid", "Avg grant aid $", "n"],
    ["instAid", "Avg institutional grant $", "n"],
    ["needMet", "% of need met", "n"],
    ["net", "Avg net price $", "n"],
    ["pctaid", "% receiving aid", "n"],
    ["debt", "Median grad debt $", "n"],
    ["pell", "% Pell recipients", "n"],
    ["netCostInc", "Net price by family income", "t"],
    ["netPriceUrl", "Net price calculator", "t"],
  ],
  "Campus life & outcomes": [
    ["type", "Public/Private", "t"],
    ["setting", "Setting", "t"],
    ["loc", "Location", "t"],
    ["size", "Undergrad size", "n"],
    ["ratio", "Student:faculty", "t"],
    ["ret", "Retention %", "n"],
    ["grad", "6-yr grad rate %", "n"],
    ["greek", "Greek life", "t"],
    ["housing", "Housing", "t"],
    ["majors", "Popular programs", "t"],
    ["campus", "Campus life notes", "t"],
    ["demographics", "Student demographics", "t"],
    ["gradRates", "6-yr grad rate by group", "t"],
  ],
  Deadlines: [
    ["plan", "Plan (ED/EA/RD)", "t"],
    ["dEA", "ED/EA deadline", "d"],
    ["dRD", "Regular deadline", "d"],
    ["dFA", "Fin aid deadline", "d"],
    ["dDec", "Decision date", "d"],
    ["req", "Requirements & platform", "t"],
    ["fee", "App fee $", "n"],
    ["url", "Website", "t"],
  ],
};
let fromHash = false;
let st = load();
if (fromHash) save();
function load() {
  try {
    const m = location.hash.match(/#d=([A-Za-z0-9+/=_-]+)/);
    if (m) restoreHash(m[1]);
  } catch (e) {}
  try {
    const d = JSON.parse(localStorage.getItem("ct1"));
    if (d) return d;
  } catch (e) {}
  return { p: {}, cs: [] };
}
function save() {
  try {
    localStorage.setItem("ct1", JSON.stringify(st));
  } catch (e) {}
}
async function restoreHash(b64) {
  const d = await unpackState(b64);
  if (d && d.cs) {
    st = d;
    history.replaceState(null, "", location.pathname);
    save();
    $("psat").value = st.p.sat || "";
    $("pgpa").value = st.p.gpa || "";
    draw();
  }
}
const $ = (id) => document.getElementById(id),
  esc = (s) =>
    String(s ?? "").replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );
const fm = (n) =>
  n === "" || n == null ? "—" : "$" + Number(n).toLocaleString();
$("fs").innerHTML =
  '<option value="">All statuses</option>' +
  STAT.map((s) => `<option>${s}</option>`).join("");
$("psat").value = st.p.sat || "";
$("pgpa").value = st.p.gpa || "";
$("psat").oninput = $("pgpa").oninput = () => {
  st.p = { sat: $("psat").value, gpa: $("pgpa").value };
  save();
  draw();
};
let seq = 0;
const AL = {
  mit: "Massachusetts Institute of Technology",
  ucla: "University of California-Los Angeles",
  berkeley: "University of California-Berkeley",
  "uc berkeley": "University of California-Berkeley",
  nyu: "New York University",
  bu: "Boston University",
  unc: "University of North Carolina at Chapel Hill",
  umich: "University of Michigan-Ann Arbor",
  "university of michigan": "University of Michigan-Ann Arbor",
  "georgia tech": "Georgia Institute of Technology",
  "ut austin": "The University of Texas at Austin",
  "university of texas at austin": "The University of Texas at Austin",
  usc: "University of Southern California",
  cmu: "Carnegie Mellon University",
  penn: "University of Pennsylvania",
  upenn: "University of Pennsylvania",
  uiuc: "University of Illinois Urbana-Champaign",
  caltech: "California Institute of Technology",
  rutgers: "Rutgers University-New Brunswick",
  "rutgers university–new brunswick": "Rutgers University-New Brunswick",
  "penn state": "Pennsylvania State University-Main Campus",
  "penn state university park": "Pennsylvania State University-Main Campus",
  "ohio state": "Ohio State University-Main Campus",
  "ohio state university": "Ohio State University-Main Campus",
  uva: "University of Virginia-Main Campus",
  umd: "University of Maryland-College Park",
  uw: "University of Washington-Seattle Campus",
  northeastern: "Northeastern University",
  stanford: "Stanford University",
};
function setMsg(t) {
  const m = $("msg");
  m.style.display = t ? "block" : "none";
  m.textContent = t;
}
function setMsgH(h) {
  const m = $("msg");
  m.style.display = h ? "block" : "none";
  m.innerHTML = h;
}
let IP = {};
fetch("./ipeds.json")
  .then((r) => (r.ok ? r.json() : {}))
  .then((j) => {
    IP = j;
    draw();
  })
  .catch(() => {});
const nz = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const srcText = (c) =>
  "Data from " +
  ([c.sc && "College Scorecard", c.ip && "IPEDS"].filter(Boolean).join(" + ") ||
    "manual entry") +
  ". ";
function mk(n) {
  return {
    id: Date.now() * 1000 + (seq++ % 1000),
    name: n,
    status: "Not started",
    ck: {},
    essays: [],
    notes: "",
    d: {},
  };
}
function fill(c) {
  let x = c.uid && IP[c.uid];
  if (!x) {
    const q = nz(AL[c.name.toLowerCase()] || c.name),
      k = Object.keys(IP).find((u) => nz(IP[u].n) === q);
    if (k) {
      c.uid = k;
      x = IP[k];
    }
  }
  if (x) {
    c.ip = 1;
    for (const k in x)
      if (k !== "n" && (c.d[k] == null || c.d[k] === "")) c.d[k] = x[k];
  }
  if (c.cds) Object.assign(c.d, c.cds.d);
}
async function enrich(c) {
  let ok = false;
  try {
    const q = AL[c.name.toLowerCase()] || c.name;
    const r = await fetch("/api/school?name=" + encodeURIComponent(q));
    if (r.ok) {
      const j = await r.json();
      if (j.d) {
        Object.assign(c.d, j.d);
        if (j.name) c.name = j.name;
        c.uid = j.id;
        c.sc = 1;
        ok = true;
      }
    }
  } catch (e) {}
  fill(c);
  return ok || !!c.ip;
}
const STOP = new Set(
  "university of the college at main campus and in".split(" "),
);
const decEnt = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
function matchH(name) {
  const q = nz(name);
  if (!q) return null;
  let best = null,
    bs = 0;
  for (const c of st.cs) {
    const k = nz(c.name);
    if (k === q) return c;
    const kw = k.split(" ").filter((w) => w.length > 1 && !STOP.has(w));
    if (!kw.length) continue;
    const r = kw.filter((w) => q.includes(w)).length / kw.length,
      s = r + kw.length / 100;
    if (r >= 0.6 && s > bs) {
      bs = s;
      best = c;
    }
  }
  return best;
}
function parseOG(t, c) {
  const d = {},
    ok = (k, v) => {
      if (v != null && v !== "" && !isNaN(v)) d[k] = v;
    };
  const m = t.match(
    /data-react-class="UniversityShowPage"[^>]*data-react-props="([^"]*)"/,
  );
  if (!m) return d;
  let j;
  try {
    j = JSON.parse(decEnt(m[1]));
  } catch (e) {
    return d;
  }
  const u = j.university || {},
    k = j.kpis || {},
    a = j.additionalInfo || {},
    ac = j.admissionConsiderations || {};
  ok("admit", k.admitRate);
  if (k.satMiddle50) {
    ok("sat25", k.satMiddle50.low);
    ok("sat75", k.satMiddle50.high);
  }
  if (k.actMiddle50) {
    ok("act25", k.actMiddle50.low);
    ok("act75", k.actMiddle50.high);
  }
  if (k.gpa) {
    ok("gpa", k.gpa.value);
    ok("gpa25", k.gpa.lowBound);
    ok("gpa75", k.gpa.highBound);
  }
  if (j.netCostByIncome && j.netCostByIncome.rows) {
    d.netCostInc = j.netCostByIncome.rows
      .map(
        (r) => r.label + ": " + fm(r.inState != null ? r.inState : r.outState),
      )
      .join(" \u00b7 ");
    if (j.netCostByIncome.netPriceCalculatorUrl)
      d.netPriceUrl = j.netCostByIncome.netPriceCalculatorUrl;
  }
  if (j.demographics) {
    const dm = j.demographics,
      bits = [];
    if (dm.residency)
      bits.push(
        dm.residency
          .map((r) => r.label + " " + r.percent + "%")
          .join(" \u00b7 "),
      );
    if (dm.gender)
      bits.push(
        dm.gender.map((r) => r.label + " " + r.percent + "%").join(" \u00b7 "),
      );
    if (dm.raceEthnicity)
      bits.push(
        dm.raceEthnicity
          .filter((r) => r.percent > 0)
          .map((r) => r.label + " " + r.percent + "%")
          .join(" \u00b7 "),
      );
    if (bits.length) d.demographics = bits.join(" | ");
  }
  if (j.graduationRates && j.graduationRates.rows) {
    d.gradRates = j.graduationRates.rows
      .filter((r) => r.universityRate > 0)
      .map(
        (r) =>
          r.label +
          " " +
          r.universityRate +
          "% (natl " +
          r.nationalAverage +
          "%)",
      )
      .join(" \u00b7 ");
  }
  ok("size", k.enrollment);
  ok("net", k.netCost && k.netCost.amount);
  if (k.retentionRate != null) ok("ret", parseFloat(k.retentionRate));
  if (u.city) d.loc = u.city + ", " + (u.stateName || "");
  if (u.isPublic != null) d.type = u.isPublic ? "Public" : "Private";
  if (u.mainWebsite) d.url = u.mainWebsite;
  if (a.totalCost) {
    const pub = (d.type || c.d.type) === "Public",
      ny = /NY$/.test(d.loc || c.d.loc || ""),
      coa = pub
        ? ny
          ? a.totalCost.inState
          : a.totalCost.outState
        : a.totalCost.outState != null
          ? a.totalCost.outState
          : a.totalCost.inState;
    ok("coa", coa);
    d.res = pub ? (ny ? "In-state" : "Out-of-state") : "Same for all (private)";
  }
  ok("debt", a.averageDebt);
  ok("needMet", a.percentOfNeedMet);
  let ed = false;
  for (const dl of ac.deadlines || []) {
    const ty = (dl.type || "").toLowerCase();
    if (/early/.test(ty) && !d.dEA) {
      d.dEA = dl.date;
      if (/decision/.test(ty)) ed = true;
    }
    if (/regular/.test(ty) && !d.dRD) d.dRD = dl.date;
    if (/fin|fafsa|aid/i.test(ty) && !d.dFA) d.dFA = dl.date;
  }
  if (!c.d.plan && (d.dEA || d.dRD))
    d.plan = [d.dEA && (ed ? "ED" : "EA"), d.dRD && "RD"]
      .filter(Boolean)
      .join("/");
  if (ac.requirements && ac.requirements.testScores)
    d.testpol = ac.requirements.testScores;
  if (ac.requirements || ac.platforms) {
    const rq = [];
    if (ac.platforms && ac.platforms.commonApp) rq.push("Common App");
    const R = ac.requirements || {};
    for (const rk of [
      "gpa",
      "classRank",
      "recommendations",
      "toefl",
      "interview",
    ]) {
      if (R[rk])
        rq.push(
          (rk === "classRank"
            ? "Class rank"
            : rk[0].toUpperCase() + rk.slice(1)) +
            ": " +
            R[rk],
        );
    }
    if (ac.specialRequirements) rq.push("Special requirements");
    if (rq.length) d.req = rq.join(" · ");
  }
  if (/Application Outcomes/.test(t)) {
    const tot = t.match(
      /<strong>([\d,]+)<\/strong>[\s\S]{0,200}?<strong>([\d,]+) \(([\d.]+)%\)[\s\S]{0,200}?<strong>([\d,]+) \(([\d.]+)%\)[\s\S]{0,200}?<strong>([\d.]+)<\/strong>[\s\S]{0,200}?<strong>(\d{3,4})<\/strong>/,
    );
    if (tot) {
      ok("cohortApps", +tot[1].replace(/,/g, ""));
      ok("cohortAdmit", +tot[3]);
      ok("cohortEnr", +tot[4].replace(/,/g, ""));
      ok("cohortAvgGpa", +tot[6]);
      ok("cohortAvgSat", +tot[7]);
    }
    const cs = t.match(
      /([\d.]+)\s*-\s*([\d.]+)<\/h6><p[^>]*>[^<]{0,40}Middle 50% SAT/i,
    );
    if (cs) {
      const lo = +cs[1],
        hi = +cs[2];
      if (lo >= 400 && hi <= 1600 && lo < hi) {
        ok("cohortSat25", lo);
        ok("cohortSat75", hi);
      }
    }
    const cg = t.match(
      /([\d.]+)\s*-\s*([\d.]+)<\/h6><p[^>]*>[^<]{0,40}Middle 50%\s*(?:Weighted\s+|Unweighted\s+)?<span[^>]*>GPA/i,
    );
    if (cg) {
      const lo = +cg[1],
        hi = +cg[2];
      if (lo > 0 && hi <= 105 && lo < hi) {
        ok("cohortGpa25", lo);
        ok("cohortGpa75", hi);
      }
    }
  }
  return d;
}
async function htmlFiles(files) {
  if (!files.length) return;
  const rep = [];
  let i = 0;
  for (const f of files) {
    setMsg(`Reading HTML ${++i} of ${files.length}: ${f.name}…`);
    try {
      const t = await f.text();
      let name = null;
      const mm = t.match(
        /data-react-class="UniversityShowPage"[^>]*data-react-props="([^"]*)"/,
      );
      if (mm) {
        try {
          name = JSON.parse(decEnt(mm[1])).university.name;
        } catch (e) {}
      }
      if (!name) {
        const t2 = t.match(/<title>([^<]*?) Statistics \|/);
        if (t2) name = t2[1].trim();
      }
      const c = name ? matchH(name) : null;
      if (!c) {
        rep.push(f.name + ": no matching college in your list");
        continue;
      }
      const d = parseOG(t, c);
      Object.assign(c.d, d);
      rep.push(`${c.name}: ${Object.keys(d).length} fields updated`);
    } catch (e) {
      rep.push(f.name + ": couldn't read file");
    }
  }
  save();
  draw();
  setMsg("HTML import. " + rep.join(" | ") + ".");
}
async function add() {
  const n = $("nm").value.trim();
  if (!n) return;
  $("nm").value = "";
  const c = mk(n);
  setMsg("Pulling data for " + n + "…");
  const ok = await enrich(c);
  st.cs.push(c);
  save();
  draw();
  if (ok) setMsg("");
  else
    setMsgH(
      "Couldn't find <b>" +
        esc(n) +
        '</b> in College Scorecard, so it was added with blank fields. Please search for the school on <a href="https://collegescorecard.ed.gov/search" target="_blank" rel="noopener">College Scorecard</a> and update this college with the exact name listed there (open the college &rarr; Data tab &rarr; College name), then click "Refresh online data".',
    );
  openM(c.id, ok ? "Overview" : "Data");
}
function openBulk() {
  $("md").innerHTML =
    `<div class="row"><h2 style="margin:0">Bulk import</h2><button onclick="closeM()">Close</button></div>
<h3>Names only</h3>
<p class="m">One college per line. Data is pulled automatically for each. Official names work best (abbreviations like MIT, NYU, UCLA are recognized).</p>
<textarea id="bl" style="min-height:100px" placeholder="University of Michigan&#10;Georgia Tech&#10;Boston University"></textarea>
<br><br><button class="p" onclick="bulk()">Import all</button>
<h3>Or paste your Overgrad table</h3>
<p class="m">Copy your college list straight from Overgrad (Name, Tier, Plan, Deadline, Status, ...). "Likely" is imported as Safety, "Will Apply" as Not started, and the deadline is assigned to the chosen plan (RD / EA / ED). Extra columns and stray numbers are ignored.</p>
<textarea id="blt" style="min-height:140px" placeholder="University of Pennsylvania&#9;Reach&#9;Regular Decision&#9;Jan 05, 2027&#9;Will Apply&#9;6&#10;Rutgers University-New Brunswick&#9;Likely&#9;Early Action I&#9;Nov 01, 2026&#9;Will Apply&#9;3"></textarea>
<br><br><button onclick="bulkTable()">Import table</button>`;
  $("ov").classList.add("on");
}
async function bulk() {
  const names = [
    ...new Set(
      $("bl")
        .value.split(/\n/)
        .map((x) => x.trim())
        .filter(Boolean),
    ),
  ].filter((n) => !st.cs.some((c) => c.name.toLowerCase() === n.toLowerCase()));
  closeM();
  const miss = [];
  let i = 0;
  for (const n of names) {
    setMsg(`Importing ${++i} of ${names.length}: ${n}…`);
    const c = mk(n);
    if (!(await enrich(c))) miss.push(n);
    st.cs.push(c);
    save();
    draw();
  }
  setMsg(
    `Imported ${names.length} college${names.length == 1 ? "" : "s"}.` +
      (miss.length
        ? ` No data found for: ${miss.join(", ")}. Add details manually or retry with the official name.`
        : ""),
  );
}
async function bulkTable() {
  const lines = $("blt")
    .value.split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  if (!lines.length) return;
  const MO = {
      jan: 1,
      feb: 2,
      mar: 3,
      apr: 4,
      may: 5,
      jun: 6,
      jul: 7,
      aug: 8,
      sep: 9,
      oct: 10,
      nov: 11,
      dec: 12,
    },
    TIER = { reach: "Reach", match: "Match", likely: "Safety" },
    SMAP = {
      "will apply": "Not started",
      applied: "Submitted",
      accepted: "Accepted",
      admitted: "Admitted",
      denied: "Rejected",
      rejected: "Rejected",
      waitlisted: "Waitlisted",
    };
  let added = 0,
    skipped = 0,
    i = 0;
  closeM();
  for (const ln of lines) {
    if (!/[a-z]/i.test(ln)) continue;
    const parts = ln.split(/\t/).map((s) => s.trim());
    if (parts.length < 4) {
      skipped++;
      continue;
    }
    const name = parts[0];
    if (st.cs.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      skipped++;
      continue;
    }
    const tier = TIER[(parts[1] || "").toLowerCase()],
      planRaw = (parts[2] || "").toLowerCase();
    let dateISO = "";
    for (let k = 3; k < parts.length; k++) {
      const m = parts[k].match(/^([A-Za-z]{3})\w*\.?\s+(\d{1,2}),?\s+(\d{4})$/);
      if (m && MO[m[1].slice(0, 3).toLowerCase()]) {
        dateISO =
          m[3] +
          "-" +
          String(MO[m[1].slice(0, 3).toLowerCase()]).padStart(2, "0") +
          "-" +
          m[2].padStart(2, "0");
        break;
      }
    }
    const c = mk(name);
    if (tier) c.tier = tier;
    c.status = SMAP[(parts[4] || "").toLowerCase()] || "Not started";
    if (dateISO) {
      if (/early action/.test(planRaw)) {
        c.d.dEA = dateISO;
        c.d.plan = "EA";
      } else if (/early decision/.test(planRaw)) {
        c.d.dEA = dateISO;
        c.d.plan = "ED";
      } else if (/regular/.test(planRaw)) {
        c.d.dRD = dateISO;
        c.d.plan = "RD";
      }
    }
    setMsg(`Importing ${++i} of ${lines.length}: ${name}…`);
    await enrich(c);
    st.cs.push(c);
    added++;
    save();
    draw();
  }
  setMsg(
    `Table import: ${added} college${added == 1 ? "" : "s"} added` +
      (skipped
        ? `, ${skipped} row${skipped == 1 ? "" : "s"} skipped (already in list or unrecognized)`
        : "") +
      ".",
  );
}
async function refresh() {
  setMsg("Refreshing " + cur.name + "…");
  const ok = await enrich(cur);
  save();
  setMsg(ok ? "" : "Couldn't refresh from College Scorecard.");
  mod();
}
async function refreshAll() {
  if (!st.cs.length) return setMsg("No colleges to refresh.");
  let ok = 0,
    fail = 0,
    i = 0;
  for (const c of st.cs) {
    setMsg(`Refreshing ${++i} of ${st.cs.length}: ${c.name}…`);
    if (await enrich(c)) ok++;
    else fail++;
  }
  save();
  draw();
  setMsg(
    `Refreshed ${st.cs.length} college${st.cs.length == 1 ? "" : "s"} from College Scorecard` +
      (fail ? ` (${ok} updated, ${fail} not found)` : "."),
  );
}
function tier(c) {
  const d = c.d,
    sat = +st.p.sat,
    a = +d.admit;
  if (c.tier) return c.tier;
  if (!sat || !d.sat75) return a && a < 15 ? "Reach" : "";
  if (a && a < 15) return "Reach";
  if (sat >= +d.sat75 && a >= 30) return "Safety";
  if (sat >= +d.sat25) return "Match";
  return "Reach";
}
const prog = (c) =>
  Math.round((CK.filter((k) => c.ck[k]).length / CK.length) * 100);
const dFor = (c) => {
  const p = (c.d.plan || "").toUpperCase();
  if (/E[DA]/.test(p)) return c.d.dEA;
  if (p.includes("RD")) return c.d.dRD;
  return [c.d.dEA, c.d.dRD].filter(Boolean).sort()[0];
};
const dd = (c) => {
  const x = dFor(c);
  return x && x >= new Date().toISOString().slice(0, 10) ? x : "";
};
const dleft = (s) => Math.ceil((new Date(s + "T23:59") - new Date()) / 864e5);
function draw() {
  const f = $("fs").value,
    so = $("so").value;
  $("stats").innerHTML =
    `<div class="st" onclick="$('fs').value='';draw()"><b>${st.cs.length}</b><span>Total</span></div>` +
    STAT.map(
      (s) =>
        `<div class="st" onclick="$('fs').value='${s}';draw()"><b>${st.cs.filter((c) => c.status === s).length}</b><span>${s}</span></div>`,
    ).join("");
  const up = st.cs
    .filter(
      (c) =>
        dd(c) &&
        ![
          "Submitted",
          "Accepted",
          "Admitted",
          "Rejected",
          "Waitlisted",
        ].includes(c.status),
    )
    .sort((a, b) => (dd(a) < dd(b) ? -1 : 1))
    .slice(0, 4);
  $("dl").innerHTML = up.length
    ? `<div class="dl"><b>⏰ Upcoming deadlines</b><br>` +
      up
        .map((c) => `${esc(c.name)} — ${dd(c)} (${dleft(dd(c))} days)`)
        .join("<br>") +
      `</div>`
    : "";
  let l = st.cs.filter((c) => !f || c.status === f);
  const dir = $("sd").value === "desc" ? -1 : 1;
  l.sort((a, b) => {
    let r = 0;
    if (so === "d") {
      const xa = dd(a),
        xb = dd(b);
      if (!xa && !xb) r = 0;
      else if (!xa) return 1;
      else if (!xb) return -1;
      else r = xa < xb ? -1 : xa > xb ? 1 : 0;
    } else if (so === "a") r = (a.d.admit || 999) - (b.d.admit || 999);
    else if (so === "c") r = (a.d.coa || 1e9) - (b.d.coa || 1e9);
    else r = a.name.localeCompare(b.name);
    return r * dir;
  });
  $("grid").innerHTML =
    l
      .map((c) => {
        const d = c.d,
          t = tier(c);
        return `<div class="c" onclick="openM(${c.id},'Overview')"><div class="row"><h2>${esc(c.name)}</h2>${t ? `<span class="pill ${t}">${t}</span>` : ""}</div>
<div class="m">${esc(d.loc || "")} ${d.type ? "· " + esc(d.type) : ""} ${d.setting ? "· " + esc(d.setting) : ""}</div>
<div style="margin:8px 0"><span class="pill s-${c.status.trim().toLowerCase().replace(/\s+/g, '-')}">${c.status}</span>${d.plan ? `<span class="pill">${esc(d.plan)}</span>` : ""}</div>
<div class="kv"><span>${d.cohortAdmit ? "Admit rate \u00b7 your school" : "Admit rate"}</span><b>${d.cohortAdmit || d.admit ? (d.cohortAdmit || d.admit) + "%" : "—"}</b><span>SAT mid-50%${d.cohortSat25 ? " · your school" : ""}</span><b>${d.cohortSat25 ? d.cohortSat25 + "–" + d.cohortSat75 : d.sat25 ? d.sat25 + "–" + d.sat75 : "—"}</b><span>GPA mid-50%${d.cohortGpa25 ? " · your school" : ""}</span><b>${d.cohortGpa25 ? d.cohortGpa25 + "–" + d.cohortGpa75 : d.gpa25 ? d.gpa25 + "–" + d.gpa75 : d.gpa || "—"}</b><span>${d.net ? "Avg net price" : "Cost of attendance"}</span><b>${d.net ? fm(d.net) : fm(d.coa)}</b><span>Next deadline</span><b>${dd(c) || "—"}</b></div>
<div class="prog"><i style="width:${prog(c)}%"></i></div><div class="m">${prog(c)}% of checklist done</div></div>`;
      })
      .join("") || '<p class="m">No colleges yet. Add one above!</p>';
}
let cur, tab;
function openM(id, t) {
  cur = st.cs.find((c) => c.id === id);
  tab = t;
  mod();
  $("ov").classList.add("on");
}
function closeM() {
  $("ov").classList.remove("on");
  draw();
}
function mod() {
  const c = cur,
    d = c.d,
    t = tier(c);
  const tb = ["Overview", "Data", "Application", "Essays", "Notes"]
    .map(
      (x) =>
        `<button class="${x === tab ? "on" : ""}" onclick="tab='${x}';mod()">${x}</button>`,
    )
    .join("");
  let b = "";
  if (tab === "Overview")
    b =
      Object.keys(G)
        .map((g) => {
          const rows = G[g].filter(
            (f) => f[0] !== "url" && d[f[0]] != null && d[f[0]] !== "",
          );
          if (!rows.length) return "";
          return (
            `<details class="grp"${g === "Your school cohort (Overgrad)" ? " open" : ""}><summary><span>${g}</span><span class="m">${rows.length}/${G[g].length}</span></summary><div class="kv">` +
            rows
              .map((f) => `<span>${f[1]}</span><b>${esc(d[f[0]]) || "—"}</b>`)
              .join("") +
            `</div></details>`
          );
        })
        .join("") +
      (d.apps && d.admitted
        ? `<p class="m">Calculated: ${((d.admitted / d.apps) * 100).toFixed(1)}% admit rate from applicants/admitted.</p>`
        : "") +
      (d.url
        ? `<p><a href="${esc(d.url)}" target="_blank" rel="noopener">Visit website ↗</a></p>`
        : "");
  if (tab === "Data")
    b =
      `<p class="m">${esc(srcText(c))}Edit anything. Fill gaps (deadlines, programs, GPA, applicant counts) from the school's admissions site or by uploading its Overgrad page.</p>
<button onclick="refresh()">↻ Refresh online data</button> <button onclick="$('htmlAll').click()">Upload this school's Overgrad page (HTML)</button><div class="f"><div><label>College name</label><input value="${esc(c.name)}" onchange="cur.name=this.value;save()"></div></div>` +
      Object.keys(G)
        .map(
          (g) =>
            `<details class="grp" ${g === "Your school cohort (Overgrad)" ? "open" : ""}><summary><span>${g}</span><span class="m">${G[g].filter((f) => d[f[0]] != null && d[f[0]] !== "").length}/${G[g].length}</span></summary><div class="f">` +
            G[g]
              .map(
                (f) =>
                  `<div><label>${f[1]}</label><input type="${f[2] === "n" ? "number" : f[2] === "d" ? "date" : "text"}" value="${esc(d[f[0]])}" onchange="cur.d['${f[0]}']=this.value;save()"></div>`,
              )
              .join("") +
            `</div></details>`,
        )
        .join("");
  if (tab === "Application")
    b =
      `<div class="f"><div><label>Status</label><select onchange="cur.status=this.value;save()">${STAT.map((s) => `<option ${s === c.status ? "selected" : ""}>${s}</option>`).join("")}</select></div>
<div><label>Reach / Match / Safety</label><select onchange="cur.tier=this.value;save()"><option value="">Auto (${t || "set your SAT"})</option>${["Reach", "Match", "Safety"].map((s) => `<option ${c.tier === s ? "selected" : ""}>${s}</option>`).join("")}</select></div></div>
<h3>Checklist (${prog(c)}%)</h3>` +
      CK.map(
        (k, i) =>
          `<label class="ck"><input type="checkbox" ${c.ck[k] ? "checked" : ""} onchange="cur.ck[CK[${i}]]=this.checked;save()"> ${k}</label>`,
      ).join("");
  if (tab === "Essays")
    b =
      `<button class="p" onclick="cur.essays.push({t:'',p:'',r:'',w:650});save();mod()">+ Add essay prompt</button><br><br>` +
        c.essays
          .map((e, i) => {
            const wc = e.r.trim() ? e.r.trim().split(/\s+/).length : 0;
            return `<div class="es"><input class="t" placeholder="Essay title (e.g. Why Us, Common App)" value="${esc(e.t)}" onchange="cur.essays[${i}].t=this.value;save()">
<textarea style="min-height:70px" placeholder="Paste the prompt" onchange="cur.essays[${i}].p=this.value;save()">${esc(e.p)}</textarea>
<textarea placeholder="Write or paste your response (or upload a .txt/.md file below)" oninput="cur.essays[${i}].r=this.value;save();wcu(${i})">${esc(e.r)}</textarea>
<div class="row"><span class="m" id="wc${i}" ${e.w && wc > e.w ? 'style="color:#b3261e"' : ""}>${wc} / <input type="number" style="width:70px" value="${e.w}" onchange="cur.essays[${i}].w=+this.value;save();wcu(${i})"> words</span>
<span><input type="file" accept=".txt,.md" onchange="upl(${i},this)" style="max-width:190px"><button class="g" onclick="cur.essays.splice(${i},1);save();mod()">Delete</button></span></div></div>`;
          })
          .join("") || '<p class="m">No essays yet.</p>';
  if (tab === "Notes")
    b = `<textarea placeholder="Notes: visit impressions, scholarships, contacts, why this school..." oninput="cur.notes=this.value;save()">${esc(c.notes)}</textarea>`;
  $("md").innerHTML =
    `<div class="row"><h2 style="margin:0">${esc(c.name)}</h2><span><button class="g" onclick="if(confirm('Remove this college?')){st.cs=st.cs.filter(x=>x!==cur);save();closeM()}">Remove</button><button onclick="closeM()">Close</button></span></div><div class="tabs">${tb}</div>${b}`;
}
function wcu(i) {
  const e = cur.essays[i],
    w = e.r.trim() ? e.r.trim().split(/\s+/).length : 0,
    s = $("wc" + i);
  s.firstChild.textContent = w + " / ";
  s.style.color = e.w && w > e.w ? "#b3261e" : "";
}
function upl(i, el) {
  const f = el.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    cur.essays[i].r = String(r.result);
    save();
    mod();
  };
  r.readAsText(f);
}

function openHtmlHelp() {
  $("md").innerHTML =
    `<div class="row"><h2 style="margin:0">How to upload college pages</h2><button onclick="closeM()">Close</button></div>
<ol class="m" style="line-height:1.9;padding-left:20px">
<li><b>Install Tampermonkey.</b> Get the free extension at <a href="https://www.tampermonkey.net" target="_blank" rel="noopener">tampermonkey.net</a> for Chrome, Edge, Firefox, or Safari, and enable it.</li>
<li><b>Install the download script.</b> <a href="/script.user.js" target="_blank" rel="noopener"><b>Open /script.user.js</b></a> in a new tab &mdash; Tampermonkey shows its install screen; click <b>Install</b>.</li>
<li><b>Visit a college page.</b> Open any Overgrad college page, e.g. <a href="https://app.overgrad.com/universities" target="_blank" rel="noopener">app.overgrad.com/universities</a>. A dark "Download HTML" button appears in the top-right corner.</li>
<li><b>Download.</b> Click that button &mdash; the page saves as <b>Page Title.html</b>. Repeat for each college.</li>
<li><b>Upload here.</b> In this tracker, click <b>Upload HTML pages</b> and select the downloaded file(s). Colleges must be in your list first (add them by name, then upload).</li>
</ol>`;
  $("ov").classList.add("on");
}
function clearAll() {
  if (
    !confirm(
      "Clear EVERYTHING? All colleges, essays, notes, and your SAT/GPA will be permanently deleted.",
    )
  )
    return;
  if (!confirm("Are you sure? This cannot be undone.")) return;
  st = { p: {}, cs: [] };
  try {
    localStorage.removeItem("ct1");
  } catch (e) {}
  history.replaceState(null, "", location.pathname);
  $("psat").value = "";
  $("pgpa").value = "";
  draw();
  setMsg("All data cleared.");
}
async function packState() {
  const raw = unescape(encodeURIComponent(JSON.stringify(st)));
  try {
    const buf = new Uint8Array(
      await new Response(
        new Blob([raw]).stream().pipeThrough(new CompressionStream("gzip")),
      ).arrayBuffer(),
    );
    let bin = "";
    buf.forEach((b) => (bin += String.fromCharCode(b)));
    return (
      "z" + btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
    );
  } catch (e) {
    return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
}
async function unpackState(s) {
  try {
    if (s[0] === "z") {
      s = s.slice(1).replace(/-/g, "+").replace(/_/g, "/");
      s += "=".repeat((4 - (s.length % 4)) % 4);
      const bin = atob(s),
        buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      const raw = await new Response(
        new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip")),
      ).text();
      return JSON.parse(decodeURIComponent(escape(raw)));
    }
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    s += "=".repeat((4 - (s.length % 4)) % 4);
    return JSON.parse(decodeURIComponent(escape(atob(s))));
  } catch (e) {
    return null;
  }
}
const SHORTENER = "https://links.kevinzheng.fyi"; // ← your shortener's URL

async function share() {
  history.replaceState(null, "", "#d=" + (await packState()));
  const long = location.href;
  const copy = (txt, msg) => {
    const done = () => setMsg(msg);
    if (navigator.clipboard && navigator.clipboard.writeText)
      navigator.clipboard
        .writeText(txt)
        .then(done)
        .catch(() => setMsg("Link: " + txt));
    else setMsg("Link: " + txt);
  };
  try {
    const r = await fetch(SHORTENER + "/api/shorten", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: long }),
    });
    const j = await r.json();
    if (!r.ok || !j.short) throw new Error(j.error || "shorten failed");
    copy(
      j.short,
      "Short link copied! Anyone who opens it gets this exact data.",
    );
  } catch (e) {
    copy(long, "Shortener unavailable — full link: " + long);
  }
}
function exp() {
  const a = document.createElement("a");
  a.href = "data:application/json," + encodeURIComponent(JSON.stringify(st));
  a.download = "college-tracker-backup.json";
  a.click();
}
$("imp").onchange = (e) => {
  const r = new FileReader();
  r.onload = () => {
    try {
      st = JSON.parse(r.result);
      save();
      $("psat").value = st.p.sat || "";
      $("pgpa").value = st.p.gpa || "";
      draw();
    } catch (x) {
      alert("Invalid backup file");
    }
  };
  r.readAsText(e.target.files[0]);
};
(function () {
  let t = "";
  try {
    t = localStorage.getItem("ct-theme") || "";
  } catch (e) {}
  if (t) document.documentElement.dataset.theme = t;
})();
function updateThemeBtn() {
  const b = $("th");
  if (b)
    b.textContent =
      document.documentElement.dataset.theme === "dark"
        ? "☀️ Light mode"
        : "🌙 Dark mode";
}
function toggleTheme() {
  const cur =
    document.documentElement.dataset.theme === "dark"
      ? "dark"
      : document.documentElement.dataset.theme === "light"
        ? "light"
        : matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
  const nx = cur === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = nx;
  try {
    localStorage.setItem("ct-theme", nx);
  } catch (e) {}
  updateThemeBtn();
}
updateThemeBtn();
draw();
