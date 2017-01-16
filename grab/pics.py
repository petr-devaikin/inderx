import json
import urllib
import requests

with open('men.json') as data_file:
    men = json.load(data_file)

i = 1
for m in men:
    for p in m["photos"]:
        s = p.split("/")
        s = s[3] + "_" + s[4]

        response = requests.get(p, stream=True)

        if not response.ok:
            print str(i) + " " + m["name"]
    i = i + 1
