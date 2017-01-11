import json
import urllib

with open('women.json') as data_file:
    men = json.load(data_file)

for m in men:
    for p in m["photos"]:
        s = p.split("/")
        s = s[3] + "_" + s[4]
        urllib.urlretrieve(p, "img/" + s)
        print s
