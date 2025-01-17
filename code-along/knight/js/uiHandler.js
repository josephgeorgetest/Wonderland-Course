WL.registerComponent('uiHandler', {
    
}, {
    start: function() {

        this.target = this.object.getComponent('cursor-target');
        this.target.addHoverFunction(this.onHover.bind(this));
        this.target.addUnHoverFunction(this.onUnHover.bind(this));
        this.target.addMoveFunction(this.onMove.bind(this));
        this.target.addDownFunction(this.onDown.bind(this));
        this.target.addUpFunction(this.onUp.bind(this));
        this.setupUI();

        this.tmpVec = new Float32Array(3);

        this.soundClick = this.object.addComponent('howler-audio-source', {src: 'sfx/click.wav', spatial: true});
        this.soundUnClick = this.object.addComponent('howler-audio-source', {src: 'sfx/unclick.wav', spatial: true});
    },

    setupUI: function(){
        const scope = this;

        function onIdle(){
            
        }
        
        function onWalk(){
            
        }
        
        function onDie(){
            
        }
        
        function onDance(){
            
        }
        //console.log('start() with param', this.param);
        const config = {
            panelSize: {
                width: 1,
                height: 0.25
            },
            height: 128,
            info: {
                type: "text",
                position:{ left: 6, top: 6 },
                width: 500,
                height: 58,
                backgroundColor: "#000",
                textAlign: "center",
                fontSize: 25,
                fontColor: "#fff"
            },
            idle: {
                type: "button",
                position:{ top: 64, left: 4 }, 
                width: 120,
                height: 55,
                fontColor: "#fff",
                fontSize: 25,
                backgroundColor: "#026",
                hover: "#048",
                onSelect: onIdle
            },
            walk: {
                type: "button",
                position:{ top: 64, left: 128 }, 
                width: 120,
                height: 55,
                fontColor: "#fff",
                fontSize: 25,
                backgroundColor: "#026",
                hover: "#048",
                onSelect: onWalk
            },
            die: {
                type: "button",
                position:{ top: 64, left: 256 }, 
                width: 120,
                height: 55,
                fontColor: "#fff",
                fontSize: 25,
                backgroundColor: "#026",
                hover: "#048",
                onSelect: onDie
            },
            dance: {
                type: "button",
                position:{ top: 64, left: 380 }, 
                width: 120,
                height: 55,
                fontColor: "#fff",
                fontSize: 25,
                backgroundColor: "#026",
                hover: "#048",
                onSelect: onDance
            },
        }
        
        const content = {
            info: "Press a button to change animation",
            idle: "Idle",
            walk: "Walk",
            die: "Die",
            dance: "Dance"
        }

        this.ui = new CanvasUI( content, config, this.object );
        this.ui.update();
        let ui = this.ui;
    },

    setAnimation: function(animation, loop=true){
        if (this.animComp){
            //TO DO
        }
    },

    onHover: function(_, cursor) {
        //console.log('onHover');
        const xy = this.ui.worldToCanvas(cursor.cursorPos);
        if (this.ui) this.ui.hover(0, xy);

        if(cursor.type == 'finger-cursor') {
            this.onDown(_, cursor);
        }

        this.hapticFeedback(cursor.object, 0.5, 50);
    },

    onMove: function(_, cursor) {
        this.ui.worldToCanvas(cursor.cursorPos);
        const xy = this.ui.worldToCanvas(cursor.cursorPos);
        if (this.ui) this.ui.hover(0, xy);

        this.hapticFeedback(cursor.object, 0.5, 50);
    },

    onDown: function(_, cursor) {
        console.log('onDown');
        /*this.soundClick.play();
        this.buttonMeshObject.translate([0.0, -0.1, 0.0]);
        this.hapticFeedback(cursor.object, 1.0, 20);*/
    },

    onUp: function(_, cursor) {
        console.log('onUp');
        this.soundUnClick.play();

        if (this.ui) this.ui.select(0);

        this.hapticFeedback(cursor.object, 0.7, 20);
    },

    onUnHover: function(_, cursor) {
        console.log('onUnHover');
        
        if (this.ui) this.ui.hover(0);

        this.hapticFeedback(cursor.object, 0.3, 50);
    },

    hapticFeedback: function(object, strength, duration) {
        const input = object.getComponent('input');
        if(input && input.xrInputSource) {
            const gamepad = input.xrInputSource.gamepad;
            if(gamepad && gamepad.hapticActuators) gamepad.hapticActuators[0].pulse(strength, duration);
        }
    },

    update: function(dt){
        if (this.ui) this.ui.update();
    }
});
