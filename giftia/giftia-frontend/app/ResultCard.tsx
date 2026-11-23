// app/ResultCard.tsx — 結果カード（部品）。2週目の変更は import の1行だけ（Gift 型の置き場所が lib/api.ts に変わった）
import type { Gift } from "@/lib/api";

export default function ResultCard({ gift, rank }: { gift: Gift; rank: number }) {
  return (
    <div className="card">
      <p className="meta">{rank}位・{gift.category}・{gift.brand}</p>
      <h3 className="name">{gift.name}</h3>
      <p className="price">{gift.price.toLocaleString()}円</p>
      <p className="meta">評価{gift.rating}（{gift.reviewCount}件）</p>
      {gift.reason && (<p className="reason"> 💡{gift.reason} </p> )}
    </div>
  );
}

{/*
メモ

def build_reason(
    gender: str,
    ageband: str,
    relationship: str,
    likes: str,
    dislikes: str,
) -> str:

    parts = []

    if likes:
        parts.append(f"{likes}がお好きな")

    if dislikes:
        parts.append(f"{dislikes}を避けたい")

    target = ""

    if ageband:
        target += f"{ageband}代"

    if gender == "female":
        target += "女性"
    elif gender == "male":
        target += "男性"

    relationship_map = {"manager": "上司", "senior": "先輩", "colleague": "同僚", "junior": "後輩"}

    if relationship:
        target += f"の{relationship_map[relationship]}"

    return f"💡 {''.join(parts)}にぴったりの送別ギフトです。"
  */}