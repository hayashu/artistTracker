import { Router, Request, Response } from "express";
import axios from "axios";
const router = Router();

// やること：
  // - req.ip または X-Forwarded-For ヘッダーから IP 取得
  // - IPジオロケーション API で timezone を特定
  // - res.json({ timezone: "America/New_York" }) を返す

router.get("", async(req, res)=>{
    // const forwarded = req.headers["x-forwarded-for"];                                                                                                    
    // const ip = (Array.isArray(forwarded)
    // ? forwarded[0]                                                                                                                                     
    // : forwarded?.split(",")[0]?.trim())
    // || req.ip                                                                                                                                          
    // || "127.0.0.1";
    // if (ip === "127.0.0.1" || ip === "::1") {
    //     res.json({ timezone: "UTC" });
    //     return;
    // }
    const ip = "202.215.109.13";
    try{
        const result = await axios.get(`http://ip-api.com/json/${ip}?fields=timezone`);
        res.json(result.data);
    }catch{
        res.json({timezone: "UTC"});
    }
    
})


export default router;