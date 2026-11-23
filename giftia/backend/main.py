# main.py — Giftia 検索API（2週目・穴埋め版）
# 【穴1】〜【穴4】を、対応表と公式ドキュメント・データ定義.md を頼りに自分で埋める。
# 埋めるまでは ___ が残っていて動かない（/api/search を呼ぶと 500 になり、ターミナルに NameError と行番号が出る）。
# 答えは 配布コード/答え合わせ/backend/main.py（自分で埋めてから見る）。
#
# 画面（Next.js）から呼ばれる「窓口」。条件を受け取り、班のDBを検索して、結果を JSON で返す。
# 起動：uvicorn main:app --reload
# 確認：http://localhost:8000/docs（Swagger UI。ブラウザから API を試せる）

import os
from typing import Literal#11/15_かずや追記
from dotenv import load_dotenv
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from database import fetch_all

load_dotenv()  # .env を読む（DB の接続情報・CORS の許可）

app = FastAPI(title="Giftia Search API（2週目）")
GENDER_VALUE = {"male": 1, "female": 2}   # DB: 0=共通, 1=男性, 2=女性 　11/15_かずや
NON_FOOD_CATEGORIES = ["食品", "飲料", "酒類"]   # non_food で除外するカテゴリー
RELATIONSHIP_LABEL = {"manager": "上司", "senior": "先輩", "colleague": "同僚", "junior": "後輩"}


# ── CORS ───────────────────────────────────────
# 画面（http://localhost:3000）と API（http://localhost:8000）は別のアプリ＝オリジンが違う。
# ブラウザは既定で「別オリジンへの通信」を止めるので、API 側が「この画面からは受け付ける」と宣言する。
# 許可する画面の URL は .env の CORS_ORIGINS に書く（カンマ区切りで複数可）。空なら何も許可しない。
origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["GET"], allow_headers=["*"])


@app.get("/api/health")
def health():
    """つながっているかの確認。どの DB に何件の商品があるか"""
    row = fetch_all("SELECT DATABASE() AS db, COUNT(*) AS products FROM products")[0]
    return {"status": "ok", "db": row["db"], "products": row["products"]}


@app.get("/api/search")
def search(
    q: str = Query(default="", description="キーワード（空白区切りで複数。すべてを含む商品）"),
    category: str = Query(default="", description="カテゴリー（空ならすべて）"),
    indiv_wrap: bool = Query(default=False, description="true なら、説明文に「個包装」とある商品だけ"),
    price_min: int | None = Query(default=None, ge=0, description="価格の下限（以上）"),
    price_max: int | None = Query(default=None, ge=0, description="価格の上限（以下）"),
    gender: Literal["all", "male", "female"] = Query(default="all", description="性別"),#引数の追加:11/15_かずや
    ageband: Literal["", "10", "20", "30", "40", "50"] = Query(default="", description="年代"),#引数の追加:11/15_かずや
    relationship: Literal["", "manager", "senior", "colleague", "junior"] = Query(default="", description="関係性(送別)"),
    likes: str = Query(default="", description="好きなもの(空白区切り。送別)"),
    dislikes: str = Query(default="", description="嫌いなもの(空白区切り。除外する。送別)"),
    mild_scent: bool = Query(default=False, description="true なら、香り付きと分かっている商品を除外(送別)"),
    non_food: bool = Query(default=False, description="true なら、食品・飲料・酒類を除外(送別)"),
    limit: int = Query(default=20, ge=1, le=100, description="返す件数"),
):
    """条件に合う商品を、人気順（直近1年の販売数）で上位 limit 件返す"""
    # ① 条件を WHERE に1つずつ足す（値は %s で渡し、SQL の文字列に直接つなげない）
    where, params = ["stock > 0"], []  # 在庫切れは出さない
    for word in q.split():  # 【穴1】q を空白で区切って1語ずつにする（文字列のメソッド）
        where.append("(product_name LIKE %s OR brand LIKE %s OR description LIKE %s)")
        params += [f"%{word}%"] * 3
    if category:
        where.append("category = %s")
        params.append(category)  # 【穴2】%s に入れる値（受け取ったカテゴリー）
    if indiv_wrap:
        where.append("description LIKE %s")  # 「個包装」は列がないので、説明文に書いてあるかで見る
        params.append("%個包装%")  # 【穴3】「個包装」をどこかに含む、という LIKE のパターン
    if price_min is not None:
        where.append("price >= %s")
        params.append(price_min)
    if price_max is not None:
        where.append("price <= %s")
        params.append(price_max)
    if gender != "all": #「性別」が指定されたときだけ、検索条件(WHERE)を1つずつ足す:11/15_かずや
        where.append("""EXISTS (SELECT 1 FROM product_recommend_tag t
        WHERE t.product_id = products.product_id
        AND t.attribute_type = 'gender' AND t.attribute_value IN (0, %s))""")
        params.append(GENDER_VALUE[gender])   # 共通(0)も含める
    if ageband:#「年代」が指定されたときだけ、検索条件(WHERE)を1つずつ足す:11/15_かずや
        where.append("""EXISTS (SELECT 1 FROM product_recommend_tag t
        WHERE t.product_id = products.product_id
        AND t.attribute_type = 'age' AND t.attribute_value = %s)""")
        params.append(int(ageband))
    if mild_scent:
        where.append("""NOT EXISTS (SELECT 1 FROM product_farewell_features f
        WHERE f.product_id = products.product_id AND f.is_scented = 1)""")
    if non_food:
        marks = ", ".join(["%s"] * len(NON_FOOD_CATEGORIES))
        where.append(f"category NOT IN ({marks})")
        params += NON_FOOD_CATEGORIES

    for word in dislikes.split():
        where.append("""(COALESCE(product_name, '') NOT LIKE %s
        AND COALESCE(brand, '') NOT LIKE %s
        AND COALESCE(description, '') NOT LIKE %s)""")
        params += [f"%{word}%"] * 3


    condition = " AND ".join(where)

    # ② 件数と、人気順の上位 limit 件を取る
    total = fetch_all(f"SELECT COUNT(*) AS n FROM products WHERE {condition}", tuple(params))[0]["n"]
    rows = fetch_all(
        f"""SELECT product_id, category, brand, product_name, price, rating, review_count
            FROM products WHERE {condition}
            ORDER BY sales_count DESC, product_id
            LIMIT %s""",
        (*params, limit),
    )
    # ③ DB の行を、画面の Gift 型（1週目）に詰め替えて返す
    reason = build_reason(gender, ageband, relationship, likes, dislikes)
    return {"total": total, "results": [to_gift(r, reason) for r in rows]}

def to_gift(r: dict, reason: str = "") -> dict:
    """DB の列名 → 画面（lib/api.ts の Gift 型）の項目名。画面側は1週目のまま変えない"""
    return {
        "id": r["product_id"],
        "category": r["category"],
        "brand": r["brand"],
        "name": r["product_name"],  # 【穴4】商品名の列名（データ定義.md の products を見る）
        "price": r["price"],
        "rating": float(r["rating"]) if r["rating"] is not None else 0,  # レビューなしは 0
        "reviewCount": r["review_count"],
        "reason": reason,
    }

def build_reason(gender: str, ageband: str, relationship: str, likes: str, dislikes: str) -> str:
    # 相手の説明を作る(例: 20代男性の先輩 / 先輩 / 20代)
    target = ""
    if ageband:
        target += f"{ageband}代"
    if gender == "female":
        target += "女性"
    elif gender == "male":
        target += "男性"
    if relationship:
        if target:
            target += "の"
        target += RELATIONSHIP_LABEL[relationship]

    parts = []
    if target:
        parts.append(f"{target}向け")
    if likes:
        parts.append(f"{likes}がお好きな方向け")
    if dislikes:
        parts.append(f"{dislikes}を含まない")

    if not parts:
        return ""   # 条件が1つもないときは理由を出さない
    return "、".join(parts) + "送別ギフトです。"
