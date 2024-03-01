const mongoose = require('mongoose');



const scoreSchema = new mongoose.Schema({
    totalRuns: {
        type: Number,
        require: true,
        default: 0,
    },

    totalWickets: {
        type: Number,
        require: true,
        default: 0,
    },
    overNo:{
        type: Number,
        require: true,
        default: 0,

    },
    ballNo:{
        type: Number,
        require: true,
        default: 0,

    },
    currentOver: {
        type:Object,
        default:{ 0: '', 1: '', 2: '', 3: '', 4: '', 5: '' }
    },
    allOvers:[

    ],
    moveValue:{
        type:Number,
        default:0,
    }
}, { timestamps: true });

const ScoreModel = mongoose.model.ScoreModel || mongoose.model('scores', scoreSchema);


module.exports = ScoreModel;