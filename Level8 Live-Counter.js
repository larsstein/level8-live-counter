// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: hashtag;
// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: magic;
/**
 *	Level8 - Live-Counter
 *
 *	Displays the number current used and free slots at the boulder location 'Level8' (Lehmweg 10 - 35398 Gießen).
 *	Website: https://levelacht.de
 *
 *  Widget information:
 *	Source: https://github.com/larsstein/level8-live-counter
 *	Author: Lars Stein
 *	Version: 1.0.1
 *	
 *	Changelog:
 * 	# 1.0.1:	Support new capacity>99; Fixed alignment issues
 */

// sets debug mode for console print outs
const DEBUG = false;

// URL to embedded frame which delivers the live counter
const COUNTER_URL = "https://www.boulderado.de/boulderadoweb/gym-clientcounter/index.php?mode=get&token=eyJhbGciOiJIUzI1NiIsICJ0eXAiOiJKV1QifQ.eyJjdXN0b21lciI6IkxldmVsOCJ9.4j0L0eSNmbhWRFVlyYMJzqoSR3ao1Lj45AQyPoV3woo";

// URL to the level8 logo
const LOGO_URL = "https://levelacht.de/wp-content/uploads/2016/01/level8_logo_web_600px-e1452780725335.png";

// indicates start of current pax data
const PAX_DELIMITER = 'class="actcounter-content"><span data-value="';

// indicates start of current free data
const FREE_DELIMITER = 'class="freecounter-content"><span data-value="';

// lower limit of the green percentage range
const GREEN = 50;

// lower limit of the yellow percentage range
const YELLOW = 20;

// setupt the background gradient
let backgroundGradient = new LinearGradient();
backgroundGradient.locations = [0, 0.2, 0.8, 1];
backgroundGradient.colors = [
	new Color("#EEB01E"),
	new Color("#F6D77C"),
	new Color("#F6D77C"),
	new Color("#EEB01E")
];

// ---------------- //
// -- START HERE -- //
// ---------------- //

let widget = await createWidget();
if (config.runsInWidget) {
	Script.setWidget(widget);
} else {
	widget.presentSmall();
}
Script.complete();

/**
 *	Creates the widget!
 */
async function createWidget() {
	
	let w = new ListWidget();  
	w.backgroundGradient = backgroundGradient;
	// load level8-logo
	let reqLogo = new Request(LOGO_URL);
	let logo = await reqLogo.loadImage();

	// add stack for heading
	let headingStack = w.addStack();
	// heading logo related
	let wLogo = headingStack.addImage(logo);
	wLogo.imageSize = new Size(35, 35);
	headingStack.addSpacer(6);
	// heading text related
	let headingText = headingStack.addText("Level 8");
	headingText.font = Font.boldRoundedSystemFont(20);  
	headingText.textColor = Color.black();
	headingText.centerAlignText();
	// sub heading text related
	let subHeadingText = w.addText("Live-Counter");
	subHeadingText.font = Font.lightSystemFont(15);  
	subHeadingText.textColor = Color.black();
	subHeadingText.centerAlignText();
	w.addSpacer(6);
	
	// content related
	// load data
	let data = await getData();
	let color = getColor(data[0], data[1]);
	if(DEBUG)console.log(color);
    
    // free
	let freeStack = w.addStack();
	freeStack.addSpacer(6);
	let freeText = freeStack.addText("Frei: ");
	freeText.font = Font.heavyMonospacedSystemFont(18);  
	freeText.textColor = Color.black();
	if(data[1] >= 100){
		freeStack.addSpacer(22);
	} else if(data[1] >= 10){
		freeStack.addSpacer(32);
	} else{ 
		freeStack.addSpacer(48);
	}	
	let freeDataText = freeStack.addText(data[1]);
	freeDataText.font = Font.heavyMonospacedSystemFont(20);   
	freeDataText.textColor = color;
	w.addSpacer(4);
    
	// used
	let usedStack = w.addStack();
	usedStack.addSpacer(6);    
	let usedText = usedStack.addText("Belegt: ");
	usedText.font = Font.mediumSystemFont(14);  
	usedText.textColor = Color.black();
	if(data[0] >= 100){
  		usedStack.addSpacer(30);  
	} else if(data[0] >= 10){
  		usedStack.addSpacer(38);
	} else {
  		usedStack.addSpacer(44);
	}
	let usedDataText = usedStack.addText(data[0]);
	usedDataText.font = Font.mediumSystemFont(14);  
	usedDataText.textColor = Color.black();
	w.addSpacer(8);

	// footer
	let dateFormatter = new DateFormatter();
	dateFormatter.useShortDateStyle();
	dateFormatter.useShortTimeStyle();
	let date = new Date();
	let footerText = w.addText(dateFormatter.string(date));
	footerText.font = Font.ultraLightSystemFont(10);  
	footerText.textColor = Color.black();
	footerText.rightAlignText();
 	
	return w;
}

/**
 *	Determines the color which is used for displaying the number of free slots.
 */
function getColor(pax, free){
	let max = parseInt(pax) + parseInt(free);
	let percent = Math.round(free * 100 / max);
	if(DEBUG) console.log("Percent free: " + percent);
	if(percent >= GREEN)
 		return Color.green();
	else if(percent >= YELLOW)
 		return Color.orange();
	else
		return Color.red();
}

/**
 *	Extracts the number of used or free slots from the given html string.
 *	If pax is true, the current number of used slots is extracted, otherwise the number of free slots.
 */
function extractData(html, pax){
	if(DEBUG) console.log("Start extracting informations...")
	let start = pax ? html.indexOf(PAX_DELIMITER) : html.indexOf(FREE_DELIMITER);
	start += pax ? PAX_DELIMITER.length : FREE_DELIMITER.length;
	if(DEBUG)console.log("Start delimiter: " + start);
	let end;
	// check if it is a single, two or three digit number
	let i = 1;
	while(html.charAt(start + i) != '"'){
  		i++;
	}
	end = start + i;
	if(DEBUG) console.log("End delimiter: " + end);
	let data = html.substring(start, end);
	if(DEBUG) console.log("Extracted data: " + data);
	if(DEBUG){
  		if(pax)
  			data = "120";
  		if(!pax)
  			data = "120";
	}
	return data;
}

/**
 *	Sends request for the html code of the live counter and extracts the relevant informations.
 *	Returns an array with current number of used slots on the first position and on the second the number of free slots.
 */
async function getData(){
	// deprecated
	/**
	* let webview = new WebView()
	* await webview.loadURL(url)
	* let data = await webview.evaluateJavaScript(getDataPickScript(), false);
	*/
	let dataReq = new Request(COUNTER_URL);
	let html = await dataReq.loadString();
	let pax = extractData(html, true);
	let free = extractData(html, false);
	return [pax, free];
}




