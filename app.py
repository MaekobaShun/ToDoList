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
    description = db.Column(db.Text, nullable=True)
    time_slot = db.Column(db.String(20), default="未分類")
    completed = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "time_slot": self.time_slot,
            "completed": self.completed
        }

### タスクを表示する　###
@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")

### APIエンドポイント ###
from flask import jsonify

@app.route("/api/todos", methods=["GET"])
def get_todos():
    todos = Todo.query.all()
    return jsonify([todo.to_dict() for todo in todos])

@app.route("/api/todos", methods=["POST"])
def add_todo():
    data = request.get_json()
    new_todo = Todo(
        title=data.get("title"),
        description=data.get("description"),
        time_slot=data.get("time_slot", "未分類")
    )
    db.session.add(new_todo)
    db.session.commit()
    return jsonify(new_todo.to_dict()), 201

@app.route("/api/todos/<int:todo_id>", methods=["PUT"])
def update_todo(todo_id):
    todo = Todo.query.get(todo_id)
    if not todo:
        return jsonify({"error": "Not found"}), 404
    
    data = request.get_json()
    if "title" in data:
        todo.title = data["title"]
    if "description" in data:
        todo.description = data["description"]
    if "time_slot" in data:
        todo.time_slot = data["time_slot"]
    if "completed" in data:
        todo.completed = data["completed"]
        
    db.session.commit()
    return jsonify(todo.to_dict())

@app.route("/api/todos/<int:todo_id>", methods=["DELETE"])
def delete_todo(todo_id):
    todo = Todo.query.get(todo_id)
    if not todo:
        return jsonify({"error": "Not found"}), 404
        
    db.session.delete(todo)
    db.session.commit()
    return jsonify({"success": True})

if __name__ == "__main__":
    # まだDBがなければ作る
    with app.app_context():
        # 既存のテーブルを削除して再作成（開発環境用）
        # 本番環境ではマイグレーション機能（Flask-Migrate）を使用しないといけない
        db.drop_all()
        db.create_all()
    # host="0.0.0.0" で同一Wi-Fi内のスマホからもアクセス可能
    app.run(debug=True, host="0.0.0.0", port=5000)