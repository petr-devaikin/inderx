import pynder
import json

facebook_id = ""
facebook_token = ""

session = pynder.Session(facebook_id, facebook_token)

users = session.nearby_users()

with open("women.json", "a") as myfile:
    for user in users:
        if len(user.photos) == 0:
            continue

        d = {
            "id": user.id,
            "name": user.name,
            "gender": "female",
            "age": user.age,
            "desc": user.schools + user.jobs,
            "info": user.bio,
            "distance": user.distance_km,
            "photos": user.photos,
        }

        if len(d["desc"]):
            d["desc"] = d["desc"][0]
        else:
            d["desc"] = ""


        print d["name"]
        myfile.write(json.dumps(d) + ",\n")
        user.dislike()
