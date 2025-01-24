import requests
import os


REPO_OWNER = "Shonen-Labs"
REPO_NAME = "StarkFinder"
GITHUB_TOKEN = os.getenv("TOKEN_GH")

def fetch_contributors():
    """
    Fetch contributors from the GitHub API.
    Returns a list of contributors with their login and profile URL.
    """
    url = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/contributors"
    headers = {"Authorization": f"token {GITHUB_TOKEN}"}
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        contributors = response.json()
        return [
            {"login": c["login"], "url": c["html_url"], "avatar": c["avatar_url"]}
            for c in contributors
        ]
    else:
        print(f"Failed to fetch contributors: {response.status_code}")
        print(response.json())
        return []

def update_readme(contributors):
    """
    Update the README.md file with a contributors section.
    """
    readme_file = "README.md"

    try:
        
        with open(readme_file, "r") as file:
            content = file.readlines()

        contributors_start = -1
        for i, line in enumerate(content):
            if line.strip() == "## Contributors":
                contributors_start = i
                break

        contributors_section = "\n## Contributors\n\n"
        for contributor in contributors:
            contributors_section += (
                f"<a href='{contributor['url']}' target='_blank'>"
                f"<img src='{contributor['avatar']}' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='{contributor['login']}' />"
                f"</a>"
            )
        contributors_section += "\n\n"

        if contributors_start != -1:
            content = content[:contributors_start] + [contributors_section]
        else:
            content.append(contributors_section)

        with open(readme_file, "w") as file:
            file.writelines(content)

        print("README.md updated successfully with contributors!")

    except FileNotFoundError:
        print("README.md file not found. Please ensure it exists in the repository.")

if __name__ == "__main__":
    contributors = fetch_contributors()
    if contributors:
        update_readme(contributors)
    else:
        print("No contributors found or an error occurred.")
