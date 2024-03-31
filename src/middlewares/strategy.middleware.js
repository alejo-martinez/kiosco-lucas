import passport from "passport";

export const strategyPassport = (strategy)=>{
    return async(req, res, next)=>{
        passport.authenticate(strategy, (err, user, info)=>{
            if(err) next(err);
            if(!user){
                return res.status(401).send({status:'error', error: info?.message || err});
            } else{
                req.user = user;
                return next();
            }
        })(req, res, next)
    }
}