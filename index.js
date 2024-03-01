const express = require('express');
const http = require('http');
const morgan = require('morgan');
const { Server } = require("socket.io");
require('dotenv').config();
const PORT = 5000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors:process.env.FRONTEND_URL,
});
const cors = require('cors');
const ScoreModel = require('./database/models/Score');
const connectToDB = require('./database/init');
const exp = require('constants');
const jwt = require('jsonwebtoken');

const secretKey = process.env.SECRET_KEY;
connectToDB();

app.use(cors());
app.use(morgan('dev'));

let ID = '';

app.use(express.json());


io.on('connection', (socket) => {
 
    socket.on('getmatchId',()=>{
             io.emit('id',ID);
    })

    socket.on('getmatchIdFromServe',()=>{
        socket.emit('sendingId',ID)
    })

   
    socket.on('startingNewMatchFromAdmin',()=>{
        ID='';
        socket.broadcast.emit('startingNewMatchToUser');
    })


    socket.on('publishscore', async (data) => {
        socket.broadcast.emit('loading',true);
        try{
        const { currentBall, value, wickets,matchId,moveValue, overNo } = data;
       
        if (!matchId && ID == '') {
            let overArr = [];
            overArr.push({ 0: '', 1: '', 2: '', 3: '', 4: '', 5: ''});
            overArr[overNo][currentBall] = value;
            let Overs = { 0: '', 1: '', 2: '', 3: '', 4: '', 5: '' };
            Overs[currentBall] = value;
            const scoreData = {
                totalRuns: value == 'Out' ? 0 : value,
                overNo:overNo,
                ballNo:currentBall+1,
                totalWickets: wickets+1,
                currentOver: Overs,
                allOvers:overArr,
                moveValue:moveValue,
            }
            const storedScore = await ScoreModel.create(scoreData);
            data.matchId = storedScore._id;
            ID = storedScore._id;
            socket.emit('matchId',storedScore._id);
            

        } else {

             let sId = matchId ? matchId : ID;
             
            const storedScore = await ScoreModel.findById({_id:sId});
            let recentOvers = storedScore.allOvers;
            const storedOver = currentBall == 5 ? { 0: '', 1: '', 2: '', 3: '', 4: '', 5: '' } : storedScore.currentOver;
            let recentOverNo = storedScore.overNo;
            currentBall != 5 ? storedOver[currentBall]=value : '';
            let ball = currentBall == 5 ? 0 : currentBall + 1;
            currentBall == 5 ? recentOverNo = recentOverNo + 1 :'';
            currentBall == 5 ? recentOvers.push({ 0: '', 1: '', 2: '', 3: '', 4: '', 5: '' }) :' '
            recentOvers[overNo][currentBall] = value;



            if(value == 'Out'){
                let newWickets = storedScore.totalWickets + 1;
                const updateScore = await ScoreModel.findByIdAndUpdate({_id:sId},{totalWickets:newWickets,currentOver:storedOver,overNo:recentOverNo,ballNo:ball,allOvers:recentOvers,moveValue});
            }else{
                let newScore = storedScore.totalRuns + value;
                const updateScore = await ScoreModel.findByIdAndUpdate({_id:sId},{totalRuns:newScore,currentOver:storedOver,overNo:recentOverNo,ballNo:ball,allOvers:recentOvers,moveValue}); 
            }

            data.matchId = sId;

            if(!matchId) {
                socket.emit('matchId',ID);
            }
        }

        setTimeout(()=>{
            socket.broadcast.emit('score', data);
        },1000)
       
    }catch(err){
        console.log(err.message);
    }
    })




    socket.on('disconnect', () => console.log('someone Disconnected from server'));


})

app.get('/getMatchData',async function(req,res){

    try{
    const { id } = req.headers ;
    const matchData = await ScoreModel.findById(id);
    if(matchData){
        return res.json({success:true,matchData});
    }else{
        return res.json({success:false,message:"some thing went wrong"});
    }
}catch(err){
        return res.json(err.message);
    }

})


app.post('/adminlogin', (req, res) => {

    try{
    const { adminemail, adminpassword } = req.body;
    if (adminemail === "admin@gmail.com" && adminpassword === "pass@243") {
      const token = jwt.sign({ adminemail }, secretKey);
      res.json({success:true, token });
    } else {
      res.status(401).json({success:false, message: 'Invalid credentials' });
    }

}catch(err){
    return res.json({success:false,message:err.message});
}
  });



app.get('/', function (req, res) {
    return res.json("Connected to backend");
})

server.listen(PORT, () => {
    console.log('server running at http://localhost:' + PORT);
});
