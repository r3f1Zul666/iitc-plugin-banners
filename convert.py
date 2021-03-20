import glob, os
import json
import hashlib
import shutil

__location__ = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
providers_url = "b/%banner%.json"
output_folder = "/b"
backup_folder = "/backup"


for file in os.listdir(__location__ + "/convert"):
    if file.endswith(".json"):
        print(file)
        with open(os.path.join(__location__, f'convert/{file}')) as data:
            root = json.load(data)

        print('Enter the region:')
        region = input()

        file_name = file

        missions = []

        for item in root:
            if item == "features":
                i = 0
                for it in root[item]:
                    mission = {}
                    for m in it["properties"]:
                        if m in ["title", "guid", "image", "ratingE6", "medianCompletionTimeMs", "numUniqueCompletedPlayers", "author", "authorTeam"]:               
                            mission[m] = root[item][i]["properties"][m]
                    missions.append(mission)
                    i += 1        
                    
                    
        file_json = {}
        file_json["name"] = file.split('.')[0]
        file_json["authors"] = {}
        author = {}
        for m in missions:
            if not m["author"] in file_json["authors"]:
                if "R" in m["authorTeam"]:
                    author[m["author"]] = "Resistance"
                else:
                    author[m["author"]] = "Enlightened"
                file_json["authors"].update(author)
        file_json["missions"] = missions

        rel_path = ""
        file_name = file
        for root, subdirs, files in os.walk(__location__ + output_folder):
            for d in subdirs:
                if d == region:
                    rel_path = root
                    with open(root + "/" + region + f"/{file_name}", 'w') as outfile:
                        json.dump(file_json, outfile, indent=2)
                    
                    shutil.move( __location__ + f"/convert/{file}", __location__ + f"{backup_folder}/{file}")
                    
        for file in os.listdir(__location__ + output_folder):
            if file == f"provider-{region}.json":
                with open(__location__ + f'{output_folder}/{file}') as data:
                    data = json.load(data)
                path = rel_path.removeprefix(f"{__location__}{output_folder}/") 
                name = file_name.split(".")[0]
                data['banners'][f"{path}/{region}/{name}"] = {}
                with open(__location__ + f'{output_folder}/{file}', 'w') as outfile:
                        json.dump(data, outfile, indent=2)
                
                    