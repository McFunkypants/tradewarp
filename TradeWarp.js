// TradeWarp by @McFunkypants
// a transport tycoon + tradewars inspired game 
// HD (post compo) edition

const SECTOR_W = 8000,
    SECTOR_H = 4500,
    PLANET_COUNT = 1000,
    SHIP_COUNT = 100,
    STARFIELD_COUNT = 50000,
    BG_PARALLAX = 0.5,
    SHIP_MAX_HOLDS = 3,
    CLOSE_TO_DEST = 16,
    SCANRANGE = 100,
    SPR_W = 16,
    SPR_H = 16,
    GUI_SCALE = 2; // 16px font

let paused,
    menuActive,
    gameCTX,
    glowSprite,
    arrowSprite,
    highlightSprite,
    trailSprite,
    infoBGsprite,
    statsBGsprite,
    headerBGsprite,
    shipnameBGsprite,
    planetnameBGsprite,
    starfieldSprite,
    bgstarfieldSprite,
    camFollowObj,
    currentlyHoveringObj,
    camX = 0,
    camY = 0,
    frame = 0,
    mouseX = 0,
    mouseY = 0,
    mouseWorldX = 0,
    mouseWorldY = 0,
    mouseIsDown = 0,
    ships = [],
    planets = [];

// RUN NOW!! INIT!!
let sprites = new Image();
sprites.onload = init;
sprites.onerror = () => { console.log('unable to download sprites'); }
sprites.src = 'Tradewarp.png';

//let music = new Audio('TradeWarp.ogg');

// we have 17 icons so far
const mat = [/*'creds',*/
    'silicon',
    'tech',
    'food',
    'plants',
    'seeds',
    'parts',
    'meds',
    'shielding',
    'controllers',
    'servers',
    'probes',
    'fuel',
    'pipes',
    'waste',
    'tools',
    'sensors',
    'data'
/*
    'metal',
    'tools',
    'fuel',
    'scientists',
    'settlers',
    'workers',
    'water',
    'carbon',
    'servos',
    'plating',
    'acid',
    'soil',
    'fungi'
*/
];
const matindex = Object.values(mat);

function generateGradientSprite(rgba1,x1,y1,rgba2,x2,y2,isVertical) {
    let can = document.createElement('canvas');
	let w = x2-x1;
	let h = y2-y1;
	can.width = w;
	can.height = h
	let ctx = can.getContext('2d');
	let grd = ctx.createLinearGradient(0,0,isVertical?0:w,isVertical?h:0);
	grd.addColorStop(0,rgba1);
	grd.addColorStop(1,rgba2);
	ctx.fillStyle = grd;
	ctx.fillRect(x1,y1,w,h);
	return can;
}

function generateGlowSprite(r,rgba1="rgba(255,255,255,1)",rgba2="rgba(255,255,255,0)") {
    let can = document.createElement('canvas');
	can.width = r*2;
	can.height = r*2;
	let ctx = can.getContext('2d');
	let grd = ctx.createRadialGradient(r,r,0,r,r,r); // (r,r,r/2,r,r,r) for a mesa
	grd.addColorStop(0,rgba1);
	grd.addColorStop(1,rgba2);
	ctx.fillStyle = grd;
	ctx.beginPath();
	ctx.arc(r,r,r,0,2*Math.PI);
	ctx.fill();
	return can;
}

function generateStarfieldSprite() {
    //console.log("generating starfield");
    let can = document.createElement('canvas');
	can.width = SECTOR_W;
	can.height = SECTOR_H;
	let ctx = can.getContext('2d');
    for (let i=0, siz=0; i<STARFIELD_COUNT; i++) {
        siz = randrangefloat(1,6);
        gameCTX.globalAlpha = randrangefloat(0.25,1);
        ctx.drawImage(glowSprite,0,0,glowSprite.width,glowSprite.height,rand(0,SECTOR_W),rand(0,SECTOR_H),siz,siz);
    }
    gameCTX.globalAlpha = 1;
	return can;
}

function generateArrowSprite() {
    let can = document.createElement('canvas');
    const r = 8; // half the size of the bitmap
	can.width = r*2;
	can.height = r*2;
	let ctx = can.getContext('2d');
    ctx.beginPath();

    // " >"
    //ctx.moveTo(r,0);
    //ctx.lineTo(r*2,r);
    //ctx.lineTo(r,r*2);

    // V
    ctx.moveTo(0,0);
    ctx.lineTo(r,r*2);
    ctx.lineTo(r*2,0);

    ctx.closePath();
    // the outline
    //ctx.lineWidth = 10;
    //ctx.strokeStyle = '#666666';
    //ctx.stroke();
    // the fill color
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fill();
	return can;
}

// a hacked version of boxybold by clint bellanger
var pixelfontimage = new Image(); 
const pixelfontw = 8*GUI_SCALE;
const pixelfonth = 8*GUI_SCALE;
const charspacing = -2*GUI_SCALE;
const linespacing = 8*GUI_SCALE;
pixelfontimage.src = 'boxybold.16px.png';
pixelfontimage.onload = function() { pixelfontimage.loaded=true; }
const pixelfontchars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!\"#$%&'(),./0123456789:?";

function micro_pixel_font(txt,x,y) {
    if (!txt) return;
    if (!pixelfontimage.loaded) return;
    //console.log("micro_pixel_font "+txt);
    if (!x) x = 0;
    if (!y) y = 0;
    x = Math.round(x); // to prevent antialiasing
    y = Math.round(y);
    var ox = 0; // offset for each letter
    var oy = 0; // for each line
    var c = ""; // current character
    var num = 0; // current spritemap sprite number
    for (var i=0; i<txt.length; i++) {
        c = txt[i];

        c = c.toUpperCase();// UPPERCASE ONLY!!!!!!! boxybold

        //console.log("c="+c);
        if (c=="\n") { // new line
            ox = 0;
            oy += linespacing;
        }
        num = pixelfontchars.indexOf(c); 
        //console.log("num="+num);
        if (num>=0) { // found?
            cx = num*pixelfontw;
            //console.log("cx="+cx);
            gameCTX.drawImage(pixelfontimage,cx,0,pixelfontw,pixelfonth,x+ox,y+oy,pixelfontw,pixelfonth);
        }
        
        if (c!="\n") ox += pixelfontw + charspacing; // advance to next column
        
        // hack: boxybold variable font hacks:
        if (c=="I"||c=="1") ox-=3*GUI_SCALE;
        if (c=="("||c==")") ox-=2*GUI_SCALE;
        if (c=="W"||c=="M") ox+=2*GUI_SCALE;
        if (c=="Y"||c=="N") ox+=1*GUI_SCALE;
    }
}

function rand(min,max) { // inclusive
    return Math.floor(Math.random()*(max-min+1))+min;
}

function randrangefloat(min,max) { // not inclusive
    return Math.random()*(max-min)+min;
}

function capitalizeFirstLetter(str) {
    return str[0].toUpperCase() + str.slice(1);
}

function rndName(syllables=3) {
    const consonants ='bcdfghjklmnpqrstvwxz';
    const vowels ='aeiouy';
    var str = "";
    for (let i =0; i<syllables; i++) {
        str += consonants[Math.floor(Math.random()*consonants.length)];
        str += vowels[Math.floor(Math.random()*vowels.length)];
    }
    str = capitalizeFirstLetter(str);
    //console.log('rndName:'+str);
	return str;
}

// easy pickings
function randomArrayItem(arr) { 
    return arr[Math.floor((Math.random()*arr.length))]; 
}

function generate() {
	//console.log("generate");
	
    glowSprite = generateGlowSprite(16,"rgba(255,255,255,0.5)","rgba(255,255,255,0)");
    highlightSprite = generateGlowSprite(32,"rgba(9,255,255,1)","rgba(9,255,255,0)");
    trailSprite = generateGradientSprite("rgba(255,255,255,0.5)",0,0,"rgba(255,255,255,0)",1000,1);

    arrowSprite = generateArrowSprite();
	starfieldSprite = generateStarfieldSprite();
	bgstarfieldSprite = generateStarfieldSprite(); // needs glowsprite

    infoBGsprite = generateGradientSprite("rgba(0,0,0,0.5)",0,0,"rgba(0,0,0,0)",128*GUI_SCALE,56*GUI_SCALE);
    statsBGsprite = generateGradientSprite("rgba(0,0,0,0.5)",0,0,"rgba(0,0,0,0)",2048*GUI_SCALE,512*GUI_SCALE);
    headerBGsprite = generateGradientSprite("rgba(0,255,255,1)",0,0,"rgba(0,255,255,0)",2048*GUI_SCALE,128*GUI_SCALE);
    planetnameBGsprite = generateGradientSprite("rgba(255,255,255,0.5)",0,0,"rgba(255,255,255,0)",128*GUI_SCALE,16*GUI_SCALE);
    shipnameBGsprite = generateGradientSprite("rgba(0,255,255,0.5)",0,0,"rgba(0,255,255,0)",128*GUI_SCALE,16*GUI_SCALE);
	
	for (let i=0;i<PLANET_COUNT;i++) {
        planets[i] = {
            n:rndName(3),
            spr:2,
            x:rand(SPR_W,SECTOR_W-SPR_W),
            y:rand(SPR_H,SECTOR_H-SPR_H),
            ang:0,
            rotvel:randrangefloat(-0.025,0.025),
            age:0,
            creds:0,
            cargo:[],
            demand:[],
            production:[],
            holdsInUse:rand(1,3)
        };
        for (let h=0; h<planets[i].holdsInUse; h++) {
            // FIXME: posible to collide random hold name and have fewer holdsInUse
            planets[i].cargo[randomArrayItem(mat)] = rand(1,99);
        }
    }
	for (let i=0;i<SHIP_COUNT;i++) {
        ships[i] = {
            n:rndName(),
            spr:1,
            x:rand(SPR_W,SECTOR_W-SPR_W),
            y:rand(SPR_H,SECTOR_H-SPR_H),
            vel:0,//rand(1,4),
            ang:rand(0,360),
            destination:0,//randomArrayItem(planets),
            holdsInUse:0,
            maxHolds:SHIP_MAX_HOLDS,
            accel:0.02,
            maxvel:64,
            age:0,
            odo:0,
            creds:0,
            cargo:[],
            //demand:[],
            //production:[]
        };
    }
	
	camFollowObj = ships[0];
	
}

function onmove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    mouseWorldX = Math.round(mouseX + camX);
    mouseWorldY = Math.round(mouseY + camY);
    if (camFollowObj && camFollowObj.vel==0) { // idle player
        // look at the mouse cursor! feels more interactive
        camFollowObj.ang = Math.atan2(mouseWorldY-camFollowObj.y,mouseWorldX-camFollowObj.x);
    }
}

function nextShip() {
    console.log('next');
    i = ships.indexOf(camFollowObj)+1;
    if (i>ships.length-1) i = 0;
    camFollowObj = ships[i];
}

function prevShip() {
    console.log('prev');
    i = ships.indexOf(camFollowObj)-1;
    if (i<0) i = ships.length-1;
    camFollowObj = ships[i];
}

function keydown(e) {
    console.log('keydown:'+e.key);
    let i;
    switch (e.key) {
        case 'p':
        case ' ':
            paused = !paused;
            console.log((paused?'':'un')+'paused');    
            break;
        case 'z':
        case 'q':
        case '[':
        case '-':
            prevShip();
            break;
        case 'x':
        case 'e':
        case ']':
        case 'Tab':
            nextShip();
            break;
    }
}

function closest(these,x,y) {
    let bestDist = 999999999;
    let bestOne = these[0];
    let d = 0;
    for (nextone of these) {
        d = dist(x,y,nextone.x,nextone.y);
        if (bestDist>d) {
            bestOne = nextone;
            bestDist = d;
        }
    }
    return bestOne;
}

function onclick(e) {
    e.preventDefault();
    //console.log('click '+mouseX+','+mouseY+' world '+mouseWorldX+','+mouseWorldY);

    let nearestShip = closest(ships,mouseWorldX,mouseWorldY);
    let shipDist = dist(nearestShip.x,nearestShip.y,mouseWorldX,mouseWorldY);

    let nearestPlanet = closest(planets,mouseWorldX,mouseWorldY);
    let planetDist = dist(nearestPlanet.x,nearestPlanet.y,mouseWorldX,mouseWorldY);

    if (planetDist < CLOSE_TO_DEST) {
        //console.log("clicked planet "+nearestPlanet.n);
        if (camFollowObj) {
            camFollowObj.destination = nearestPlanet;
            camFollowObj.routeLength = distance(camFollowObj,camFollowObj.destination); // so we know eta
            //console.log("starting a journey of length "+camFollowObj.routeLength);
        }
    }
    
    if (shipDist < CLOSE_TO_DEST) {
        //console.log("clicked ship "+nearestShip.n);
        camFollowObj = nearestShip;
    }
}

function onmouseup(e) {
    mouseIsDown = false;
    e.preventDefault();
}

let sfxboom;

function initSound() {
    //console.log("init sound...");
    sfxboom = zzfxG(...[,,333,.01,0,.9,4,1.9,,,,,,.5,,.6]);
    sfxwarp = zzfxG(...[,,539,0,.04,.29,1,1.92,,,567,.02,.02,,,,.04]);
}

function playsfx(snd,vol=0.25,rate=44100,rateRandomness=4000) {
    //console.log("playing a sound");
    zzfxV=vol; // sound volume is 0..1
    //zzfxR=rate; // wobble this for random pitch
    zzfxR=rand(rate-rateRandomness,rate+rateRandomness);
    if (snd) zzfxP(snd);
}

let firstClick = true;
function onmousedown(e) {

    if (firstClick) { 
        firstClick = false;
        //try { music.play(); } catch(e) {}; }
        initSound();
    }
    
    if (Math.random()>0.5) playsfx(sfxboom); else playsfx(sfxwarp);

    e.preventDefault();

    mouseX = e.clientX;
    mouseY = e.clientY;

    mouseIsDown = true;

    if (e.which>1) {
		// left button
    } else {
		// right or middle etc
    }

	mouseWorldX = Math.round(mouseX + camX);
    mouseWorldY = Math.round(mouseY + camY);

    //console.log('click '+mouseX+','+mouseY);

    if (menuActive) {
        menuActive = false;
        //console.log("menu clicked! starting game!");
    }

    // test collision detection!
    //if (collides(mouseX+camX,mouseY+camY)) console.log('You clicked the road!');

    /*
	if (USE_MUSIC && !music) {
        console.log('init music');
        music = document.getElementById('engineloop');
        if (LOOP_MUSIC) {
            //music.loop = true;
            //music.loopStart = 0.1;
            //music.loopEnd = music.duration - 0.1;
            music.addEventListener('timeupdate', function(){
            var buffer = 0.1; //0.44?
            if(this.currentTime > this.duration - buffer){
                this.currentTime = 0.15;
                this.play();
            }
            });
        }
        music.play();
    }
	*/
}

function renderInventory(obj,cx,cy) {
    if (cx==undefined) cx = obj.x-camX;
    if (cy==undefined) cy = obj.y-camY+8*GUI_SCALE;
    cx = Math.round(cx);
    cy = Math.round(cy);
    let holdsused = 0;
    gameCTX.drawImage(infoBGsprite,cx-16,cy-4);
    for (hold in obj.cargo) {
        //console.log("hold:"+hold);
        holdsused++;
        micro_pixel_font(hold+":"+obj.cargo[hold],cx+6*GUI_SCALE,cy+4);
		let sprnum = matindex.indexOf(hold) % 17 + 3; // HARDCODED reuse
		gameCTX.drawImage(sprites,sprnum*SPR_W,0,SPR_W,SPR_H,cx-10,cy-1+4,SPR_W,SPR_H); // mat icon
        cy += 16*GUI_SCALE;
    }

    // no cargo? we have room for a tutorial!
    if (!holdsused) {
        gameCTX.globalAlpha = 0.25;
        micro_pixel_font("Cargo holds are empty.\nClick ships and planets to warp.\n\nShips auto-trade to\nmaximize profit.",cx-8,cy+4);
        gameCTX.globalAlpha = 1;
    }
    
    // fill empty spaces? buggy
    /*
    else if (holdsused<2) {
        cy += 32;
        gameCTX.globalAlpha = 0.25;
        for (let n=0; n<3-holdsused; n++) {
            micro_pixel_font("(EMPTY CARGO HOLD)",cx-12,cy+4);
            cy -= 16;
        }
        gameCTX.globalAlpha = 1;
    }
    */
}

const STATS_FREQ = 1; // optimization? NAH! every n frames, recalculate stats
let guiStatsCount = []; // cached totals
let guiStatsWaitFrames = STATS_FREQ; 
function renderGUI(smallMode) {
    //console.log("renderGUI waiting "+guiStatsWaitFrames);

    guiStatsWaitFrames--;

    if (guiStatsWaitFrames<1) { // refresh time!

        guiStatsCount = []; // trash old data - GC WARNING
        timeToRecalculate = true;
        guiStatsWaitFrames = STATS_FREQ;

        for (ship of ships) { // of means you get the object
            //console.log('scanning ship '+ship.n);
            for (hold in ship.cargo) { // in means you get the key
                if (!guiStatsCount[hold]) guiStatsCount[hold] = 0; // init
                guiStatsCount[hold] += ship.cargo[hold];
                //console.log(ship.n+' has '+ship.cargo[hold]+' '+hold+'(s) so our total is '+guiStatsCount[hold]);
            }
        }
    }
    

    // draw every material, even ones we have zero of
    // using the cached stats data
    let startx = 16;
    let cx = startx;
    let cy = gameCanvas.height - 64 - 4;
    let holdname = '';
    let num = 0;
    let spacing = 108;
    let rowheight = 24;

    if (smallMode) { // tiny one on top of screen!
        cy = 4;
        spacing = 36*GUI_SCALE;
        // centered
        startx = cx = Math.round(gameCanvas.width/2 - (spacing*mat.length/2));
    }

    // header
    if (!smallMode) {
        gameCTX.drawImage(headerBGsprite,0,cy-8-24,gameCanvas.width,24);
        micro_pixel_font("Galactic fleet ("+ships.length+" ships) total holdings:",8,cy-24);
        // background
        gameCTX.drawImage(statsBGsprite,0,cy-8,gameCanvas.width,128);
    }


    for (let i=0; i<mat.length; i++) {
        holdname = mat[i]; // string key like 'sensors'
        num = guiStatsCount[holdname]?guiStatsCount[holdname]:0; // zero if undefined
        //console.log('mat ui: '+holdname+' = '+num); 
        
        micro_pixel_font((smallMode?'':holdname+':')+num,cx+8,cy/*+4*/);
		
        // the icon
		let sprnum = matindex.indexOf(holdname) % 17 + 3; // HARDCODED reuse
        gameCTX.drawImage(sprites,sprnum*SPR_W,0,SPR_W,SPR_H,cx-10,cy-1,SPR_W,SPR_H); // mat icon
        
        cx += spacing;
        if (cx > gameCanvas.width - spacing) { // wrap
            cy += rowheight;
            cx = startx;
        }

    }
}

function renderShipInfo(ship,centeredOnScreen) {
    let x = Math.round(ship.x-camX);
    let y = Math.round(ship.y-camY);

    if (centeredOnScreen) { // stops a wobble due to float coords
        x = Math.round(gameCanvas.width/2);
        y = Math.round(gameCanvas.height/2);
    }
    gameCTX.drawImage(shipnameBGsprite,x-64*GUI_SCALE+16,y-80*GUI_SCALE-12);

    micro_pixel_font(ship.n.toUpperCase()+' (cargo ship)',
        x-64*GUI_SCALE+4*GUI_SCALE+16,y-75*GUI_SCALE-12);
    
    renderInventory(ship,x-64*GUI_SCALE+16*GUI_SCALE,y-60*GUI_SCALE-16);

    gameCTX.drawImage(arrowSprite,x-8,y-16*GUI_SCALE+4);

    if (ship.destination) {
        micro_pixel_font(Math.round(distance(ship,ship.destination))+"au to "+ship.destination.n,x+16*GUI_SCALE,y-4*GUI_SCALE);
    }
}

const planetTypes = ['tropical','lush','icy','frozen','rocky','molten','forest','desolate','dark','cloudy','poisonous','urban','mining','observation','science','bucolic','pastoral','swampy'];
const DEG_TO_RAD =  Math.PI / 180.0;

function renderPlanetInfo(planet) {
    let x = Math.round(planet.x-camX);
    let y = Math.round(planet.y-camY);

    gameCTX.drawImage(planetnameBGsprite,x-64*GUI_SCALE+16,y-80*GUI_SCALE-16*GUI_SCALE+4);

    micro_pixel_font(planet.n.toUpperCase()+' ('+planetTypes[(planet.x+planet.y*100000)%planetTypes.length]+' planet)',
        x-64*GUI_SCALE+4*GUI_SCALE+16,y-75*GUI_SCALE-16*GUI_SCALE+4);
    
    renderInventory(planet,x-64*GUI_SCALE+16*GUI_SCALE,y-60*GUI_SCALE-16*GUI_SCALE);
    
    //gameCTX.setTransform(1,0,0,1,x,y);
    //gameCTX.rotate(90*DEG_TO_RAD);
    //gameCTX.drawImage(arrowSprite,0,0);
    //gameCTX.setTransform(1,0,0,1,0,0); // reset

    gameCTX.drawImage(arrowSprite,x-8*GUI_SCALE,y-16*GUI_SCALE-8*GUI_SCALE);

}

function render() {
    gameCTX.clearRect(0,0,gameCanvas.width,gameCanvas.height);
	
    if (starfieldSprite) gameCTX.drawImage(starfieldSprite,-camX,-camY);
    if (bgstarfieldSprite) gameCTX.drawImage(bgstarfieldSprite,-camX*BG_PARALLAX,-camY*BG_PARALLAX);
    
    // have to update this every frame due to motion
    currentlyHoveringObj = closest(planets,mouseWorldX,mouseWorldY);

    let scount = 0;
    for (planet of planets) {
		
		if (onscreen(planet)) {
            scount++;
            if (glowSprite) {
                if (currentlyHoveringObj==planet) { // highlight
                    gameCTX.drawImage(highlightSprite,planet.x-camX-highlightSprite.width/2,planet.y-camY-highlightSprite.height/2);
                } else { // standard small glow
                    gameCTX.drawImage(glowSprite,planet.x-camX-glowSprite.width/2,planet.y-camY-glowSprite.height/2);
                }
            }
            gameCTX.setTransform(1,0,0,1,planet.x-camX,planet.y-camY);
            gameCTX.rotate(planet.ang);
            gameCTX.drawImage(sprites,planet.spr*SPR_W,0,SPR_W,SPR_H,-SPR_W/2,-SPR_H/2,SPR_W,SPR_H);
            gameCTX.setTransform(1,0,0,1,0,0); // reset
            
            if (currentlyHoveringObj==planet || camFollowObj==planet) {
                renderPlanetInfo(planet);
            }
            
            // scan nearby planets?
            /*
            if (distance(planet,camFollowObj)<SCANRANGE 
                micro_pixel_font(planet.n.toUpperCase(),planet.x-camX-ofsx+8,planet.y-camY+16-ofsy);
            }
            */
        }
    }
    //console.log('rendered '+scount+' of '+planets.length+' planets');
    scount = 0;
	for (ship of ships) {
        if (onscreen(ship,320)) { // extra wiggle room for long trails
            
            scount++;
            gameCTX.setTransform(1,0,0,1,ship.x-camX,ship.y-camY);
            gameCTX.rotate(ship.ang+Math.PI); // 180 degrees
            if (trailSprite) gameCTX.drawImage(trailSprite,0,0,trailSprite.width,trailSprite.height,0,-4,ship.vel*64,8); // straight trail
            //gameCTX.rotate(ship.ang); // without the flip flop
            gameCTX.rotate(-Math.PI); // go back
            if (glowSprite) gameCTX.drawImage(glowSprite,0,0,glowSprite.width,glowSprite.height,-18,-8,16,16);
            gameCTX.drawImage(sprites,ship.spr*SPR_W,0,SPR_W,SPR_H,-SPR_W/2,-SPR_H/2,SPR_W,SPR_H);
            gameCTX.setTransform(1,0,0,1,0,0); // reset
            
            //if (distance(ship,camFollowObj)<SCANRANGE ||
            if (camFollowObj==ship || currentlyHoveringObj==ship) {
                renderShipInfo(ship,true);
            }
        }
    }
    //console.log('rendered '+scount+' of '+ships.length+' ships');

    renderGUI(); // big mode at bottom with text
    renderGUI(true); // small mode at top of screen

}

function onscreen(obj,wiggleroom=64) {
    let x1 = camX - wiggleroom;
    let x2 = camX + gameCanvas.width + wiggleroom;
    let y1 = camY - wiggleroom;
    let y2 = camY + gameCanvas.height + wiggleroom;
    return (obj.x>x1 && obj.x<x2 && obj.y>y1 && obj.y<y2);
}

/*
function turntowards(obj,target,turnspeed=1) // turn the shortest distace towards something UNTESTED
{        
	obj.ang %= 360;
	// Calculate angle to target point
    var targetAngle = (Math.atan2(target.y-obj.y, target.x-obj.x) * (180/Math.PI))+90;
    targetAngle = (targetAngle+360)%360;            
	if(obj.ang != targetAngle)
    {
        // Get the difference between the current angle and the target angle
        var netAngle = (obj.ang - targetAngle + 360)%360 ;
        var delta = Math.min(Math.abs(netAngle-360), netAngle, turnspeed);
        var sign  = (netAngle-180) >= 0 ? 1 : -1;
        // Turn in the closest direction to the target
        obj.ang += sign*delta+360;            
        obj.ang %= 360;
    }
    else
    {
        // done
    }
}
*/
const SLOWDOWNDIST = 32;
const IMPULSEVEL = 0.1;

function movetowards(obj,target) {
	
	// far enough away - engage!
	let targetDist = distance(obj,target);
	if  (targetDist > (obj.routeLength+CLOSE_TO_DEST)/2) {//SLOWDOWNDIST) { // speed up!
		//console.log('speeding up '+targetDist+' of '+obj.routeLength);
        obj.vel += ship.accel;
	} else { // slow down when near to target
		//console.log('slowing down '+targetDist+' of '+obj.routeLength);
		obj.vel -= ship.accel;
	}
	
	obj.vel = Math.min(obj.maxvel,obj.vel); // maximum speed
	obj.vel = Math.max(IMPULSEVEL,obj.vel); // minimum speed

    obj.ang = Math.atan2(target.y-obj.y,target.x-obj.x);

    obj.prevx = obj.x;
	obj.prevy = obj.y;

	obj.x += obj.vel * Math.cos(obj.ang);
	obj.y += obj.vel * Math.sin(obj.ang);

	// measure distance travelled
	obj.odo += dist(obj.prevx,obj.prevy,obj.x,obj.y);
}

function distance(a,b) {
    return Math.sqrt(Math.pow((a.x-b.x),2)+Math.pow((a.y-b.y),2));
}

function dist(x1,y1,x2,y2) {
    return Math.sqrt(Math.pow((x1-x2),2)+Math.pow((y1-y2),2));
}

function simulate() { // FIXED SIMULATION STEP
	//console.log('simulate');

    if (paused) return;

	for (planet of planets) 
	{ 
		planet.age++;
	    planet.ang += planet.rotvel; 
	}
	for (ship of ships) 
	{
		ship.age++;
		if (ship.destination) {
			
            var dist = distance(ship,ship.destination);
			/*
            console.log(ship.n+
				" at "+Math.round(ship.x)+","+Math.round(ship.y)+
				" is " + Math.round(dist) + " pixels away from "+
				ship.destination.n+
				" at "+Math.round(ship.destination.x)+","+Math.round(ship.destination.y));
			*/	
			if (dist > CLOSE_TO_DEST) { // can overshoot
				movetowards(ship,ship.destination);
			} else {
				console.log(ship.n+" reached destination: "+ship.destination.n);
                trade(ship,ship.destination);
                ship.vel = 0; // stop so we accel again
                ship.routeLength = 0;
                if (ship.autopilot)
                    ship.destination = randomArrayItem(planets);
                else
                    ship.destination = null; // wait for orders
			}
		} else {
            // ship has no destination
        }
	}
	
	if (camFollowObj) {
		camX = camFollowObj.x - gameCanvas.width/2;
		camY = camFollowObj.y - gameCanvas.height/2;
	}
	
}

function animate(timestamp) {
	//console.log('animate');
	simulate();
	render();
	requestAnimationFrame(animate);
}

function resize() {
    //console.log('resize');
    gameCanvas.width = window.innerWidth;
    gameCanvas.height = window.innerHeight;
}

/*
function div(txt,id,cls,parent) {
    var newdiv = document.createElement('div');
    if (txt) newdiv.innerHTML=txt;
    if (id) newdiv.id = id;
    if (cls) newdiv.className = cls;
    if (!parent) parent = document.body;
	parent.appendChild(newdiv);
    return newdiv;
}
let topbardiv;
let uidivs = [];
function initUI() {
	console.log('initui');
    topbardiv = div('Tradewarp day 5 of 13 by @mcfunkypants - made for #js13k<br>','topbar');
    let uiBL = div('Creds:','uiBL');
    for (let i=0; i<mat.length; i++) {
        console.log('new ui: '+mat[i]);
        let another = div(mat[i],mat[i],'ui',topbardiv);
        uidivs.push(another);
    }
}
*/

function init() {
	//console.log('init');
	
    // the game viewport
    gameCanvas = document.createElement('canvas');
	document.body.appendChild(gameCanvas);
    gameCTX = gameCanvas.getContext('2d');
	resize();

    // the html overlay ui
    // initUI();

	// events
	document.addEventListener('contextmenu', event => event.preventDefault());
	window.addEventListener('click',onclick);
	window.addEventListener('mouseup',onmouseup);
	window.addEventListener('mousedown',onmousedown);
	window.addEventListener('mousemove',onmove);
	window.addEventListener('resize',resize);
	window.addEventListener('keydown',keydown);

	generate();
	animate();
}

function trade(ship,planet) {
    //console.log(ship.n+" is trading with "+planet.n);
    var quantity = 1;
    for (hold in planet.cargo) {
        //if (!ship.cargo[hold]) ship.cargo[hold] = 0; // no nulls
        //console.log("bartering "+hold+" ship:"+ship.cargo[hold]+" planet:"+planet.cargo[hold]);
		
        // NEW cargo if we have space
		if (ship.cargo[hold]==undefined && (ship.holdsInUse < ship.maxHolds)) {
			ship.holdsInUse++;
			//console.log(hold+" will be NEW HOLD #"+ship.holdsInUse);
            ship.cargo[hold] = quantity;
            planet.cargo[hold] -= quantity;
		} else if (planet.cargo[hold] > ship.cargo[hold]) { // buy from planet
            //console.log(ship.n+" buying "+quantity+" more "+hold+" from "+planet.n);
            ship.cargo[hold] += quantity;
            planet.cargo[hold] -= quantity;
        } else if (planet.cargo[hold] < ship.cargo[hold]) { // sell to planet
            //console.log(ship.n+" selling "+quantity+" "+hold+" to "+planet.n);
            ship.cargo[hold] -= quantity;
            planet.cargo[hold] += quantity;
        } else {
            // equal - no deal
        }
    }
}

