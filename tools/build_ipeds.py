"""Convert the IPEDS 2024-25 Access database (IPEDS202425.MDB) into ipeds.json for the tracker.
  pip install access-parser
  python tools/build_ipeds.py path/to/IPEDS202425.MDB          -> writes ./ipeds.json (put next to index.html)
  python tools/build_ipeds.py path/to/IPEDS202425.MDB --list   -> only writes ipeds_columns.txt (column names, for debugging)
Keeps 4-year public and private nonprofit schools. Missing tables/columns are skipped, never fatal."""
import sys, re, json
from access_parser import AccessParser
db = AccessParser(sys.argv[1]); names = list(db.catalog.keys())
def find(pat):
    c = sorted(n for n in names if re.fullmatch(pat, n, re.I)); return c[-1] if c else None
def table(pat):
    n = find(pat)
    if not n: print("  (table not found:", pat + ")"); return {}
    print("  reading", n); t = {k.upper(): v for k, v in db.parse_table(n).items()}; out = {}
    COLS.append(f"{n}: " + ", ".join(sorted(t)))
    for i, u in enumerate(t.get("UNITID", [])): out.setdefault(str(u), []).append({k: v[i] for k, v in t.items()})
    return out
def num(x):
    try: x = float(x); return x if x >= 0 else None
    except (TypeError, ValueError): return None
def first(row, *cols):
    for c in cols:
        v = num(row.get(c))
        if v is not None: return v
def latest(row, prefix):  # CHG2AY -> CHG2AY3 (highest year suffix present)
    c = sorted(k for k in row if re.fullmatch(prefix + r"\d", k)); return num(row[c[-1]]) if c else None
CIP = {"01":"Agriculture","03":"Natural Resources","04":"Architecture","05":"Area/Ethnic Studies","09":"Communication & Journalism","11":"Computer Science","13":"Education","14":"Engineering","15":"Engineering Tech","16":"Languages","22":"Legal Studies","23":"English","24":"Liberal Arts","26":"Biology","27":"Math & Statistics","30":"Interdisciplinary","31":"Parks & Fitness","38":"Philosophy","40":"Physical Sciences","42":"Psychology","43":"Criminal Justice","44":"Public Administration","45":"Social Sciences","50":"Visual & Performing Arts","51":"Health Professions","52":"Business","54":"History"}
COLS = []
print("Loading tables (this can take a few minutes for a 560MB file)...")
hd = table(r"HD\d{4}"); adm = table(r"ADM\d{4}"); ic = table(r"IC\d{4}"); c1 = table(r"COST1_\d{4}"); np_ = table(r"COST2_\d{4}_NetPrice")
sfa = table(r"SFA\d{4}"); efd = table(r"EF\d{4}D"); drvef = table(r"DRVEF\d{4}"); gr = table(r"DRVGR\d{4}"); cc = table(r"C\d{4}_A")
open("ipeds_columns.txt", "w").write("\n\n".join(COLS)); print("Wrote ipeds_columns.txt (small file listing each table's columns)")
if "--list" in sys.argv: sys.exit()
res = {}
for u, rows in hd.items():
    h = rows[0]
    if num(h.get("ICLEVEL")) not in (1, None) or num(h.get("CONTROL")) not in (1, 2): continue
    pub = num(h.get("CONTROL")) == 1; out = pub and h.get("STABBR") != "NY"; d = {"n": h.get("INSTNM")}
    d["loc"] = f'{h.get("CITY")}, {h.get("STABBR")}'; d["type"] = "Public" if pub else "Private"
    loc = num(h.get("LOCALE")); d["setting"] = {1:"City",2:"Suburb",3:"Town",4:"Rural"}.get(int(loc // 10)) if loc else None
    w = h.get("WEBADDR"); d["url"] = (w if str(w).startswith("http") else "https://" + str(w)) if w else None
    a = (adm.get(u) or [{}])[0]; ap, ad = num(a.get("APPLCN")), num(a.get("ADMSSN"))
    d["apps"], d["admitted"], d["enr"] = ap, ad, num(a.get("ENRLT"))
    if ap and ad: d["admit"] = round(ad / ap * 100, 1)
    for k, (x, y) in {"sat25": ("SATVR25", "SATMT25"), "sat75": ("SATVR75", "SATMT75")}.items():
        p, q = num(a.get(x)), num(a.get(y)); d[k] = p + q if p and q else None
    d["act25"], d["act75"] = num(a.get("ACTCM25")), num(a.get("ACTCM75"))
    i = (ic.get(u) or [{}])[0]  # campus life flags (1 = yes)
    feats = [t for c, t in [("SLO6","study abroad"),("SLOA","undergraduate research"),("SLO5","ROTC"),("ASSOC1","NCAA athletics"),("SPORT1","football")] if num(i.get(c)) == 1]
    if feats: d["campus"] = ", ".join(feats).capitalize()
    y = (c1.get(u) or [{}])[0]; d["fee"] = first(y, "APPLFEEU")
    tu = latest(y, "CHG3AY" if out else "CHG2AY")
    if tu is None: t_, f_ = first(y, "TUITION3" if out else "TUITION2"), first(y, "FEE3" if out else "FEE2"); tu = t_ + (f_ or 0) if t_ else None
    rm, bk, ot = latest(y, "CHG5AY"), latest(y, "CHG4AY"), latest(y, "CHG6AY")
    d["tuition"], d["room"], d["books"] = tu, rm, bk; d["res"] = ("Out-of-state" if out else "NY in-state") if pub else "Same for all (private)"
    if tu and rm: d["coa"] = tu + rm + (bk or 0) + (ot or 0)
    n = (np_.get(u) or [{}])[0]
    if not out: d["net"] = first(n, "NPIS42", "NPT42", "NPIS41", "NPT41")  # net price is based on in-state students for publics
    s = (sfa.get(u) or [{}])[0]; d["pctaid"], d["aid"], d["instAid"] = num(s.get("AGRNT_P")), num(s.get("AGRNT_A")), num(s.get("IGRNT_A"))
    e = (efd.get(u) or [{}])[0]; r = num(e.get("STUFACR")); d["ratio"] = f"{round(r)}:1" if r else None; d["ret"] = num(e.get("RET_PCF"))
    d["size"] = num((drvef.get(u) or [{}])[0].get("EFUG"))
    g = (gr.get(u) or [{}])[0]; d["grad"] = first(g, "GRRTTOT", "GBA6RTT", "BAGR150")
    fam = {}
    for row in cc.get(u, []):
        cip = str(row.get("CIPCODE", "")).replace("'", "")
        if num(row.get("AWLEVEL")) == 5 and num(row.get("MAJORNUM")) in (1, None) and cip[:2] in CIP and num(row.get("CTOTALT")): fam[cip[:2]] = fam.get(cip[:2], 0) + num(row["CTOTALT"])
    if fam:
        tot = sum(fam.values()); d["majors"] = ", ".join(f"{CIP[k]} {round(v/tot*100)}%" for k, v in sorted(fam.items(), key=lambda x: -x[1])[:5])
    res[u] = {k: v for k, v in d.items() if v not in (None, "")}
json.dump(res, open("ipeds.json", "w"), separators=(",", ":")); print("Wrote ipeds.json with", len(res), "schools")
print("Coverage (how many schools have each field):")
for k in ["admit","sat25","act25","tuition","room","coa","net","aid","instAid","ratio","ret","grad","size","majors","campus"]: print(f"  {k:9}{sum(1 for v in res.values() if k in v)}")
