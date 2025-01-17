WL.registerComponent('GhoulHandler', {
    path: { type: WL.Type.Object },
    vrCamera: { type: WL.Type.Object },
    speed: { type: WL.Type.Float, default: 2.0 },
    attackAnim: { type: WL.Type.Animation },
    dieAnim: { type: WL.Type.Animation },
    walkAnim: { type: WL.Type.Animation },
    delayStart: { type: WL.Type.Float, default: 0 },
    player: { type: WL.Type.Object }
}, {
    init: function() {
        //console.log('init() with param', this.param);
        this.tmpVec = glMatrix.vec3.create();
        this.tmpVec1 = glMatrix.vec3.create();
        this.tmpVec2 = glMatrix.vec3.create();
        this.tmpQuat = glMatrix.quat.create();
        
        this.startTarget = glMatrix.vec3.create();
        this.target = glMatrix.vec3.create();
        this.direction = glMatrix.vec3.create();
        this.rotateTime = 0.25;//time taken to rotate to target direction

        this.elapsedTime = 0;
        this.mode = 0;//0-waiting 1-walking 2-attacking 3-dying 
    },
    start: function() {
        //console.log('start() with param', this.param);
        this.animComp = this.object.getComponent('animation');

        this.sfxFootsteps = this.object.addComponent('howler-audio-source', {src: 'sfx/footsteps.mp3', volume: 0.3, loop: true, spatial: false});
        this.sfxGroan = this.object.addComponent('howler-audio-source', {src: 'sfx/groan.mp3', spatial: false});
        this.sfxRoar = this.object.addComponent('howler-audio-source', {src: 'sfx/roar.mp3', spatial: false});
    },
    spawn: function(){
        this.animComp.animation = this.walkAnim;
        this.animComp.playCount = 0;
        this.animComp.play();
        this.setPathSection( 0 );
        this.sfxFootsteps.play();
    },
    setPathSection( index ){
        console.log(`GhoulHandler.setPathSection> index=${index}`);
        this.pathIndex = index;
        this.playerTarget = ( index >= (this.path.children.length-1) );
        if ( this.playerTarget ){
            this.getNode( this.tmpVec, index );
            this.vrCamera.getTranslationWorld( this.target );
            this.target[1] = this.tmpVec[1];
        }else{
            this.getNode( this.tmpVec, index );
            this.getNode( this.target, index + 1 );
        }
        this.object.getForward( this.tmpVec2 );
        glMatrix.vec3.copy( this.tmpVec1, this.target );
        this.tmpVec1[1] = this.tmpVec[1];
        this.object.setTranslationWorld( this.tmpVec );
        this.object.lookAt( this.tmpVec1 );
        //glMatrix.quat.copy( this.targetRotation, this.object.rotationLocal );
        glMatrix.vec3.subtract( this.direction, this.target, this.tmpVec );
        glMatrix.vec3.normalize( this.direction, this.direction );
        glMatrix.vec3.scale( this.direction, this.direction, this.speed );
        if (index == 0){
            glMatrix.vec3.copy( this.startTarget, this.target );
        }else{
            const len = glMatrix.vec3.distance( this.target, this.tmpVec );
            glMatrix.vec3.scale( this.tmpVec2, this.tmpVec2, len );
            glMatrix.vec3.add( this.startTarget, this.tmpVec2, this.tmpVec );
            this.object.lookAt( this.startTarget );
            this.pathTime = 0;
        } 
    },
    getNode: function( vec, index ){
        this.path.children[index].getTranslationWorld( vec );
    },
    blendRotation: function( delta ){
        glMatrix.vec3.lerp( this.tmpVec, this.startTarget, this.target, delta );
        this.object.getTranslationWorld( this.tmpVec1 );
        this.tmpVec[1] = this.tmpVec1[1];
        this.object.lookAt( this.tmpVec );
    },
    waiting: function(dt){
        this.elapsedTime += dt;
        if (this.elapsedTime > this.delayStart){
            this.spawn();
            this.mode = 1;
        }
    },
    walking: function(dt){
        glMatrix.vec3.copy( this.tmpVec, this.direction );
        glMatrix.vec3.scale( this.tmpVec, this.tmpVec, dt );
        this.object.getTranslationWorld( this.tmpVec1 );
        const dist1 = glMatrix.vec3.distance( this.tmpVec1, this.target );
        this.object.translate( this.tmpVec );
        this.object.getTranslationWorld( this.tmpVec1 );
        const dist2 = glMatrix.vec3.distance( this.tmpVec1, this.target );
        this.pathTime += dt;
        if ( this.pathTime < this.rotateTime ) this.blendRotation( this.pathTime/this.rotateTime );
        if (this.playerTarget && dist2 < 2.5 ){
            this.animComp.animation = this.attackAnim;
            this.animComp.play();
            this.elapsedTime = 0;
            this.mode = 2;
            this.sfxFootsteps.stop();
            this.sfxRoar.play();
            return;
        }
        if (dist2 > dist1){
            if (this.playerTarget){
                this.spawn();
            }else{
                this.setPathSection( ++this.pathIndex );
            }
        }
    },
    attacking: function(dt){
        this.elapsedTime += dt;
        if (this.elapsedTime > 4){
            this.spawn();
            this.mode = 1;
        }
    },
    dying: function(dt){
        this.elapsedTime += dt;
        if (this.elapsedTime > 4){
            this.spawn();
            this.mode = 1;
        }
    },
    shot: function(){
        this.animComp.animation = this.dieAnim;
        this.animComp.playCount = 1;
        this.animComp.play();
        this.elapsedTime = 0;
        this.mode = 3;
        this.sfxFootsteps.stop();
        this.sfxGroan.play();
    },
    update: function(dt) {
        //console.log('update() with delta time', dt);
        switch( this.mode ){
            case 0:
                this.waiting(dt);
                break;
            case 1:
                this.walking(dt);
                break;
            case 2:
                this.attacking(dt);
                break;
            case 3:
                this.dying(dt);
                break;
        }
    },
});
