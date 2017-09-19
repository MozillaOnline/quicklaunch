new Vue({
    el :'body > .panel',
    data(){return{
        mainList :[
        {
            i18n :'popup__notepad',
            icon :'/images/skin/notepad.png',
            action(){alert('open notepad!')},
        },{
            i18n :'popup__mspaint',
            icon :'/images/skin/mspaint.png',
            action(){alert('open mspaint!')},
        },{
            i18n :'popup__calc',
            icon :'/images/skin/calc.png',
            action(){alert('open calc!')},
        },{
            i18n :'popup__myComputer',
            icon :'/images/skin/myComputer.png',
            action(){alert('open myComputer!')},
        },{
            i18n :'popup__paintWebpage',
            icon :'/images/skin/paintWebpage.png',
            action(){alert('paint webpage!')},
        },{
            i18n :'popup__switchProfile',
            icon :'/images/skin/switchProfile.png',
            action(){alert('switch profile!')},
        }],
        additionalList :[
            [{
                i18n :'popup__manageQuickLaunch',
                icon :'/images/skin/customizmyql.png',
                action(){alert('manage quick launch!')},
            }]
        ],
    }},
    methods :{
        i18n :browser.i18n.getMessage,
    },
});

//todo: can I use vue.js?
//todo: should only has 48x48 and 96x96 icons
//todo: miss 64x64 browser_action icon
//todo: test release
//todo: default_locale