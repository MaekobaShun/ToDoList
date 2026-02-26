from flask import Flask, render_template, request, redirect, url_for
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///db.sqlite"
db = SQLAlchemy(app)

class Todo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100))

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

if __name__ == "__main__":
    # まだDBがなければ作る
    with app.app_context():
        db.create_all()
    app.run(debug=True)