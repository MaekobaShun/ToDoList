from flask import Flask, render_template, request, redirect, url_for
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///db.sqlite"
db = SQLAlchemy(app)

### モデルクラス ###
# db.Modelを継承して、Todoクラスを作成
class Todo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100))
    time_slot = db.Column(db.String(20), default="未分類")
    completed = db.Column(db.Boolean, default=False)

### タスクを表示する　###
# DBから全てのtodoレコードを取得し、index.htmlテンプレートに渡す
@app.route("/", methods=["GET", "POST"])
def home():
    todo_list = Todo.query.all()
    return render_template("index.html", todo_list=todo_list)

### タスク追加 ###
# titleを貰って、todoを含めてインスタンス化し、dbにadd,commitする
# dbにcommit後はタスク表示のurlにリダイレクト
@app.route("/add", methods=["POST"])
def add():
    title = request.form.get("title")
    new_todo = Todo(title=title)
    db.session.add(new_todo)
    db.session.commit()
    return redirect(url_for("home"))

### タスク削除 ###
# <int:todo_id>はURLの一部を変数として受け取る仕組み
# 削除は毎回/delete/todo_idのように変化するから変数に入れる
@app.route("/delete/<int:todo_id>", methods=["POST"])
def delete(todo_id):
    todo = Todo.query.filter_by(id=todo_id).first()
    db.session.delete(todo)
    db.session.commit()
    return redirect(url_for("home"))

@app.route("/move/<int:todo_id>", methods=["POST"])
def move(todo_id):
    slot = request.form.get("slot")
    if slot not in ["朝", "昼", "夜"]:
        return redirect(url_for("home"))

    todo = Todo.query.filter_by(id=todo_id).first()
    if todo:
        todo.time_slot = slot
        db.session.commit()
    return redirect(url_for("home"))

if __name__ == "__main__":
    # まだDBがなければ作る
    with app.app_context():
        # 既存のテーブルを削除して再作成（開発環境用）
        # 本番環境ではマイグレーション機能（Flask-Migrate）を使用しないといけない
        db.drop_all()
        db.create_all()
    app.run(debug=True)