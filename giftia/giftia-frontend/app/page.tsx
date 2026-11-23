// app/page.tsx — Giftia 検索画面（2週目・穴埋め版）
// 【穴7】【穴8】を、対応表と公式ドキュメントを頼りに自分で埋める。
// 答えは 配布コード/答え合わせ/frontend/page.tsx（自分で埋めてから見る）。
// 1週目との違い：①searchGifts が FastAPI を呼ぶ（async/await）②入力した条件を渡す ③つながらないときの表示
"use client"; // ← ブラウザで動く合図。useState や onClick を使う画面に必要

import React, { useState } from "react";
import ResultCard from "./ResultCard";
import { searchGifts, type Gift } from "@/lib/api";

export default function Home() {
  // ① 状態（変化するデータ）を覚える箱
  const [mode, setMode] = useState<"standard" | "business" | "farewell">("standard"); // どのタブか
  const [step, setStep] = useState(1);//送別診断順番に質問コーナー
  const [keyword, setKeyword] = useState("");                             // 入力した言葉
  const [category, setCategory] = useState("");                           // 選んだカテゴリー
  const [indivWrap, setIndivWrap] = useState(false); // 個包装だけ（取引先へのお礼）（送別）
  const [priceBand, setPriceBand] = useState("");                         // 価格帯（取引先へのお礼）（送別）
  const [results, setResults] = useState<Gift[] | null>(null);            // 検索結果
  const [error, setError] = useState("");                                 // つながらないときの文言
  const [gender, setGender] = useState("all"); // 性別（送別）
  const [ageband, setAgeband] = useState(""); // 年齢層（送別）
  const [relationship, setRelationship] = useState(""); // 関係性（送別）
  const [likes, setLikes] = useState(""); //好きなもの（送別）
  const [dislikes, setDislikes] = useState(""); //嫌いなもの（送別）
  const [mildScent, setMildScent] = useState(false); //香りが弱い（送別）
  const [nonFood, setNonFood] = useState(false); //食品以外（送別）
  const [loading, setLoading] = useState(false);//【自分で追加】読み込み中かどうか、初期はfalse

  // ② 検索ボタンの処理（API に聞くので、結果が返るまで待つ＝async/await）
  async function runSearch() {
    setError("");
    setLoading(true);//【自分で追加】読み込み中はtrue
    // いま開いているタブの条件だけを送る（もう一方のタブの入力は送らない）
    const condition = mode === "standard"
      ? { keyword, category, indivWrap: false, priceBand: "" , gender: "all", ageband: "", relationship: "", likes: "", dislikes: "", mildScent: false, nonFood: false}
      : mode === "business" ? { keyword: "", category: "", indivWrap, priceBand, gender: "all", ageband: "", relationship: "", likes: "", dislikes: "", mildScent: false, nonFood: false}
      : { keyword: "", category: "", indivWrap, priceBand, gender, ageband, relationship, likes, dislikes, mildScent, nonFood};
    try {
      setResults(await searchGifts(condition));
    } catch (err) {
      setResults(null);
      setError(`APIにつながりません：${(err as Error).message}`); // 原因はブラウザの Console に出る
    }
    finally {
      setLoading(false);
    }//【自分で追加】検索終了後にfalse
  }

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();// ページの再読み込みを止める
    await runSearch();
  }


  function onReset(){
  setKeyword("");
  setCategory("");
  setIndivWrap(false);
  setPriceBand("");
  setResults(null);
  setError("");
  setGender("all");
  setAgeband("");
  setRelationship("");
  setLikes("");
  setDislikes("");
  setStep(1);
  }//【自分で追加】

  // ③ 画面
  return (
    <main className="page">
      <header className="header"><h1>Giftia</h1></header>

      {/* タブ：state(mode)＋条件で出し分ける */}
      <nav className="modes">
        <button className={mode === "standard" ? "on" : ""} onClick={() => { setMode("standard"); onReset(); }}>いまの検索</button>
        <button className={mode === "business" ? "on" : ""} onClick={() => { setMode("business"); onReset(); }}>取引先へのお礼</button>
        <button className={mode === "farewell" ? "on" : ""} onClick={() => { setMode("farewell"); onReset(); }}>送別おまかせ診断</button>
      </nav>

      <form className="form" onSubmit={onSearch}>
        {mode === "standard" && (
          <>
            <input className="q" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="キーワード（例：送別 お菓子）" />
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">すべてのカテゴリー</option>
              <option value="コスメ">コスメ</option>
              <option value="食品">食品</option>
              <option value="生活雑貨">生活雑貨</option>
              <option value="飲料">飲料</option>{/*【自分で追加】*/}
            </select>
          </>
        )}
        {mode === "business" && (
          <>
            <label className="chk"><input type="checkbox" checked={indivWrap} onChange={(e) => setIndivWrap(e.target.checked)} /> 個包装</label>
            <select value={priceBand} onChange={(e) => setPriceBand(e.target.value)}>
              <option value="">すべての価格帯</option>
              <option value="3000">3,000〜5,000円</option>
              <option value="5000">5,000〜10,000円</option>
            </select>
          </>
        )}
        {mode === "farewell" && (
          <div className="farewell-container">
            <div className="question-card">

{/*ここから追加分 */}

                {step === 1 && (
                  <div>
                    <div className="question-header">
                      <div className="question-step">質問 1 / 6</div>
                      <h2>－予算を教えてください－</h2>
                      <p className="question-subtitle">送別ギフトの予算を選んでください</p>
                    </div>
                    <button type="button" className={priceBand === "" ? "selected" : ""} onClick={() => {setPriceBand(""); setStep(2); }}>すべての価格帯</button>
                    <button type="button" className={priceBand === "0" ? "selected" : ""} onClick={() => {setPriceBand("0"); setStep(2); }}>〜3,000円</button>
                    <button type="button" className={priceBand === "3000" ? "selected" : ""} onClick={() => {setPriceBand("3000"); setStep(2); }}>3,000〜5,000円</button>
                    <button type="button" className={priceBand === "5000" ? "selected" : ""} onClick={() => {setPriceBand("5000"); setStep(2); }}>5,000〜10,000円</button>
                    <button type="button" className={priceBand === "10000" ? "selected" : ""} onClick={() => {setPriceBand("10000"); setStep(2); }}>10,000円〜</button>
                    {/*<button type="button" onClick={() => {setPriceBand(""); setStep(2);}}>すべての価格帯</button>//備忘録にとっときます。。*/}
                  </div>
                )}

                {step === 2 && (
                  <div>

                    <div className="question-header">
                      <button type="button" className="back-btn" onClick={() => setStep(1)}>← 戻る</button>
                      <div className="question-step">質問 2 / 6</div>
                      <h2>－相手の性別を教えてください－</h2>
                      <p className="question-subtitle">送別ギフトを贈る相手の性別を選んでください</p>
                    </div>

                    <button type="button" className={gender === "all" ? "selected" : ""} onClick={() => {setGender("all"); setStep(3); }}>指定しない</button>
                    <button type="button" className={gender === "male" ? "selected" : ""} onClick={() => {setGender("male"); setStep(3); }}>男性</button>
                    <button type="button" className={gender === "female" ? "selected" : ""} onClick={() => {setGender("female"); setStep(3); }}>女性</button>
                  </div>
                )}

                  {step === 3 && (
                    <div>
                      <div className="question-header">
                        <button type="button" className="back-btn" onClick={() => setStep(2)}>← 戻る</button>
                        <div className="question-step">質問 3 / 6</div>
                        <h2>－相手の年齢を教えてください－</h2>
                        <p className="question-subtitle">送別ギフトを贈る相手の年齢を選んでください</p>
                      </div>

                      <button type="button" className={ageband === "" ? "selected" : ""} onClick={() => {setAgeband(""); setStep(4); }}>指定しない</button>
                      <button type="button" className={ageband === "20" ? "selected" : ""} onClick={() => {setAgeband("20"); setStep(4); }}>20代</button>
                      <button type="button" className={ageband === "30" ? "selected" : ""} onClick={() => {setAgeband("30"); setStep(4); }}>30代</button>
                      <button type="button" className={ageband === "40" ? "selected" : ""} onClick={() => {setAgeband("40"); setStep(4); }}>40代</button>
                      <button type="button" className={ageband === "50" ? "selected" : ""} onClick={() => {setAgeband("50"); setStep(4); }}>50代以上</button>
                    </div>
                  )}

                  {step === 4 && (
                    <div>
                      <div className="question-header">
                        <button type="button" className="back-btn" onClick={() => setStep(3)}>← 戻る</button>
                        <div className="question-step">質問 4 / 6</div>
                        <h2>－相手との関係性を教えてください－</h2>
                        <p className="question-subtitle">送別ギフトを贈る相手の関係を選んでください</p>
                      </div>

                      <button type="button" className={relationship === "" ? "selected" : ""} onClick={() => {setRelationship(""); setStep(5); }}>指定しない</button>
                      <button type="button" className={relationship === "manager" ? "selected" : ""} onClick={() => {setRelationship("manager"); setStep(5); }}>上司</button>
                      <button type="button" className={relationship === "senior" ? "selected" : ""} onClick={() => {setRelationship("senior"); setStep(5); }}>先輩</button>
                      <button type="button" className={relationship === "colleague" ? "selected" : ""} onClick={() => {setRelationship("colleague"); setStep(5); }}>同僚</button>
                      <button type="button" className={relationship === "junior" ? "selected" : ""} onClick={() => {setRelationship("junior"); setStep(5); }}>後輩</button>
                    </div>
                  )}

                  {step === 5 && (
                    <div>
                    <div className="question-header">
                      <button type="button" className="back-btn" onClick={() => setStep(4)}>← 戻る</button>
                      <div className="question-step">質問 5 / 6</div>
                      <h2>－相手の好みを知っていますか－</h2>
                      <p className="question-subtitle">送別ギフトを贈る相手の好みを知っていますか</p>
                    </div>

                      <button type="button" onClick={() => {setStep(6);}}>相手の好みを知っている</button>
                      <button type="button" onClick={() => {setStep(100);}}>相手の好みを知らない</button>
                    </div>
                  )}

                  {step === 6 && (
                    <div>
                      <div className="question-header">
                        <button type="button" className="back-btn" onClick={() => setStep(5)}>← 戻る</button>
                        <div className="question-step">質問 6 / 6</div>
                        <h2>－相手の好みを教えてください－</h2>
                        <p className="question-subtitle">送別ギフトを贈る相手の好みを入力してください</p>
                      </div>

                      <input className="q" value={likes} onChange={(e) => setLikes(e.target.value)} placeholder="好きなもの（例：紅茶 ジュース）" />
                      <input className="q" value={dislikes} onChange={(e) => setDislikes(e.target.value)} placeholder="嫌いなもの（例：ビール コーヒー）" />

                      <button className="cta" type="button" onClick={runSearch}>おすすめを見る</button>
                    </div>
                  )}

                  {step === 100 && (
                    <div>
                      <div className="question-header">
                        <button type="button" className="back-btn" onClick={() => setStep(5)}>← 戻る</button>
                        <div className="question-step">質問 5.5 / 6</div>
                        <h2>－好みに左右されにくいギフトを探しますか－</h2>
                      </div>

                      <button type="button" onClick={() => {setStep(101);}}>好みに左右されにくいギフトを探す</button>
                      <button type="button" onClick={() => {runSearch();}}>好みに左右されにくいギフトを探さない</button>
                    </div>
                  )}

                  {step === 101 && (
                    <div>
                      <div className="question-header">
                        <button type="button" className="back-btn" onClick={() => setStep(100)}>← 戻る</button>
                        <div className="question-step">質問 6 / 6</div>
                        <h2>－好みに左右されにくいギフトを探します－</h2>
                        <p className="question-subtitle">相手の情報が少ない場合は、避けたい条件を選んでください（複数選択可）</p>
                      </div>

                      <label className="chk"><input type="checkbox" checked={mildScent} onChange={(e) => setMildScent(e.target.checked)}/>香りが弱いほうがいい</label>
                      <label className="chk"><input type="checkbox" checked={indivWrap} onChange={(e) => setIndivWrap(e.target.checked)}/>個包装がいい</label>
                      <label className="chk"><input type="checkbox" checked={nonFood} onChange={(e) => setNonFood(e.target.checked)}/>食べ物以外がいい</label>

                      <button className="cta" type="button" onClick={runSearch}>おすすめを見る</button>
                    </div>
                  )}
            </div>
          </div>
        )}       
        
        {mode !== "farewell" && (
          <button type="submit">検索</button>
        )}
      </form>

      {mode !== "farewell" && (
        <button type="button" onClick={onReset}>リセット</button>
      )}

      {loading && <p className="summary">🔍 検索中...</p>}{/*【自分で追加】setloadingがtrueで出現*/}

      {error && <p className="summary">{error}</p>}

      {/* 結果：同じ ResultCard を map で並べる（使い回し） */}
      {results && (
        <section>
          <p className="summary">上位 {results.length} 件</p>
          <div className="grid">
            {results.map((g, i) => <ResultCard key={g.id} gift={g} rank={i + 1} />)}
          </div>
        </section>
      )}
    </main>
  );
}
