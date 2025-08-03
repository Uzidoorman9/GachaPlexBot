import os, shutil, uuid, json, subprocess
from flask import Flask, session, redirect, request, render_template
from dotenv import load_dotenv
import requests

load_dotenv()
app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET")

# GitHub + Discord OAuth config
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
DISCORD_CLIENT_ID = os.getenv("DISCORD_CLIENT_ID")
DISCORD_CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET")
CALLBACK_URL = os.getenv("CALLBACK_URL")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/login/github")
def github_login():
    return redirect(
        f"https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}&scope=repo"
    )

@app.route("/callback/github")
def github_callback():
    code = request.args.get("code")
    res = requests.post(
        "https://github.com/login/oauth/access_token",
        headers={"Accept": "application/json"},
        data={
            "client_id": GITHUB_CLIENT_ID,
            "client_secret": GITHUB_CLIENT_SECRET,
            "code": code,
        },
    )
    session["github_token"] = res.json().get("access_token")
    return redirect("/login/discord")

@app.route("/login/discord")
def discord_login():
    return redirect(
        f"https://discord.com/api/oauth2/authorize?client_id={DISCORD_CLIENT_ID}&redirect_uri={CALLBACK_URL}/callback/discord&response_type=code&scope=identify"
    )

@app.route("/callback/discord")
def discord_callback():
    code = request.args.get("code")
    data = {
        "client_id": DISCORD_CLIENT_ID,
        "client_secret": DISCORD_CLIENT_SECRET,
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": f"{CALLBACK_URL}/callback/discord",
        "scope": "identify",
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    res = requests.post("https://discord.com/api/oauth2/token", data=data, headers=headers)
    token = res.json().get("access_token")
    session["discord_token"] = token

    user_info = requests.get("https://discord.com/api/users/@me", headers={
        "Authorization": f"Bearer {token}"
    }).json()
    session["discord_user"] = user_info
    return redirect("/create")

@app.route("/create", methods=["GET", "POST"])
def create_bot():
    if request.method == "GET":
        if not session.get("github_token") or not session.get("discord_user"):
            return redirect("/")
        return render_template("bot_form.html")

    # POST: Generate bot
    bot_name = request.form["bot_name"]
    prefix = request.form["prefix"]
    repo_name = f"{bot_name.replace(' ', '-')}-{uuid.uuid4().hex[:6]}"

    # 1. Create repo on GitHub
    headers = {
        "Authorization": f"token {session['github_token']}",
        "Accept": "application/vnd.github+json",
    }
    res = requests.post(
        "https://api.github.com/user/repos",
        headers=headers,
        json={"name": repo_name, "private": False},
    )
    if res.status_code != 201:
        return f"GitHub repo creation failed: {res.json()}"

    clone_url = res.json()["clone_url"]
    local_path = f"./temp_bots/{repo_name}"
    shutil.copytree("bot-template", local_path)

    # 2. Fill config
    with open(f"{local_path}/config_template.json") as f:
        cfg = json.load(f)
    cfg["prefix"] = prefix
    with open(f"{local_path}/config.json", "w") as f:
        json.dump(cfg, f, indent=2)

    # 3. Push to GitHub
    subprocess.run(["git", "init"], cwd=local_path)
    subprocess.run(["git", "config", "user.email", "factory@example.com"], cwd=local_path)
    subprocess.run(["git", "config", "user.name", "Bot Factory"], cwd=local_path)
    subprocess.run(["git", "add", "."], cwd=local_path)
    subprocess.run(["git", "commit", "-m", "Initial bot commit"], cwd=local_path)
    subprocess.run(["git", "branch", "-M", "main"], cwd=local_path)
    subprocess.run(["git", "remote", "add", "origin", clone_url], cwd=local_path)
    subprocess.run(["git", "push", "-u", "origin", "main"], cwd=local_path)

    shutil.rmtree(local_path)  # delete local copy

    return f"✅ Your bot repo is ready: <a href='{clone_url}'>{clone_url}</a>"

if __name__ == "__main__":
    app.run(debug=True)
