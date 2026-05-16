## Welcome to the Jooba FE Module ##

**Jooba** is a full-featured jackpot management platform. You can learn more at https://jooba.tech.

### Install ###
**CDN** 
 [https://cdn.jooba.tech/dist/jooba.min.js](https://cdn.jooba.tech/dist/jooba.min.js)

**NPM** npm install --save jooba-fe-module
 
 
>Within your Front End, the Jooba SDK will look for a `div` with id **`jooba-container-root`** upon initialisation.  
If not found, then the SDK will mount the widget from `document.body` or it can be used with the optional param `root` to define where to append the widget.

### Initialisation and Display of the Jackpot Widget ###
`jooba.init()`

To display the jackpot widget you only need to call the function above with the **required parameters** as defined below:

**Required Params:**  
1. brandId  
2. eventId  
3. playerId  
4. applicationKey   

Example: 

```js
jooba.init({
                brandId : 'yourbrand',
                eventId:'starburst_html5',
                playerId:'player1',
                applicationKey:'6106256daa52e22a2a0472017c6e6c70'
        })
```
>These required parameters **except playerId** will be provided via the Jooba back office. Speak to your Jackpot CRM or Jooba Account Manager for access.

>The `playerId` parameter is any unique player data that has meaning within your systems. It can be an ID, an alias, an email address or similar.


**Optional Params:**  
1. ``log``: boolean ==> display console.log on each action or event 
2. ``root``: HTMLElement ==> the container that will append the jooba widget
3. ``style``:
```js
    {
         model: 1 || 2 || 3,
         src: 'string' // (custom css url) 
    }
     // see more about custom styles in the below section
```
5. ``media``: 
```js
    { 
          key:'widget' ,
          type:'lottie'|| 'img',
          src: 'media URL'// (custom asset url) 
    }
```
> see more about lottie at: https://lottiefiles.com/

## Extra Functions ##
Jooba provides extra functions to further customise your
widget interaction, based on events or not.



### Actions ###  
Actions to call from your app. These calls can also be called from the widget by the user.


##### jooba.actions.optin() #####  
This function opts a player into the current jackpot.  
This is the same action when a user clicks to opt in within the widget.
   
```js
jooba.actions.optin()
```  

&nbsp;  
&nbsp;  
##### jooba.actions.optOut() #####  
This function opts a player out of the current jackpot.  
This is the same action when a user clicks to opt out within the widget
   
```js
jooba.actions.optOut()
```  

&nbsp;  
&nbsp;  
##### jooba.actions.betJackpot() #####  
This function can be used for every user bet/wager or any other event.
Params:  
1. `wager` - the amount that the user bet/wager.  

```js
jooba.actions.betJackpot({wager:10})
```  

&nbsp;  
&nbsp;  
##### jooba.actions.updateText() #####  
This function lets you change text and labels on the widget and related pages.  
Params:  
1. `key` - the text id to change. See the list of keys bellow.  
2. `value` - a string containing the new text to display (HTML tags not supported)
 
```js
jooba.actions.updateText('optInButton','new opt in button text')
```
>This function should be used after ``jooba.init()`` because some texts come from jackpot model and can be override your settings. 

List of keys: 

| Key                         | Default                                        |
| --------------------------- | ---------------------------------------------- |
| jackpotName                 | **from jackpot model**                         |
| optInButton                 | **from jackpot model** or 'Opt in Jackpot'     |
| optOutButton                | **from jackpot model** or 'Opt Out Jackpot'    |
| loading                     | 'Loading...'                                   |
| errorDefaultMessage         | 'Sorry,Something went wrong try again later.'  |
| userInLabel                 | 'You have joined the jackpot, good luck!'       |
| winMessage                  | 'CONGRATS! YOU WON THE JACKPOT!'               |
| closeWidgetConfirmMessage   | 'Are you sure?'                               |
| termsAndConditionsContent   | **from jackpot model**                         |
| termsPopupAcceptButtonLabel | 'To join to this jackpot just click bellow'    |
| termsPopupGetOutButtonLabel | 'To get out of this jackpot just click bellow' |

>Values from jackpot model come from Jackpot setup flow within the Jooba backoffice. Speak to your Jackpot CRM for more information.



#### Callbacks ####  
You can do actions based on jackpot events.

```js
jooba.events.on()
```  
Params:  
1. `key` - the event id that you want listen for
2. `Function` - a Function that will be called at the event moment and may or may not receive properties


Example  
```js
jooba.events.on('optin',({playerId})=>{
                console.log(`user ${playerId} has opted for jackpot`)
        })
```  
Using this function will return `playerId` and a console log a message.  
From this model you can customise for your needs.

See below the list of events with this feature and their return values.

List of keys: 

| Callback Key | Description                              | Returns                                                                  |
| ------------ | ---------------------------------------- | ------------------------------------------------------------------------ |
| optin        | return when user opts in for a jackpot    | `{playerId,eventId}:object`                                              |
| optOut       | return when user opts out of ajackpot    | `{playerId,eventId}:object`                                              |
| updateAmount | return when jackpot on widget is updated | `amount:number`                                                          |
| userWin      | return when user wins a jackpot          | `{amount, currency, playerId, operator, displayWinnerAnimation}:object` |

> **userWin**, when you add a callback to this event we not display the winner animation per default,
> you can display a custom animation/message or if you want our default animation, call the displayWinnerAnimation provide at callback return 


## Custom Widget Style ##

Jooba provides a complete API to customise the widget style. 

Set it up at ``jooba.init()`` or with only the widget media at ``jooba.actions.updateWidgetMedia({key,type,src})``


### Complete style customisation ###

For a complete widget style you should set it up at ``jooba.init()``.
Choose a Jooba widget DOM model and add a custom style source url. 
Jooba provides three models of DOM structure. Check the below for an idea on which style you should use. 

>Attention: models only can be `1`, `2` or `3` and the CSS code should follow the example model.

**CSS Example:**
>URL's will be here



**Code Example:**
```js
jooba.init({
                brandId : 'yourbrand',
                eventId:'starburst_html5',
                playerId:'player1',
                applicationKey:'6176156dea52f62a2a0472017c6e6c70',
                style:{
                          model:1, // 1, 2 or 3 
                          src:'{your-cdn-url}/style.css'
                      },
                media:{
                        key:'widget',
                        type:'lottie' || 'img', // lottie or img 
                         src:'{your-cdn-url}/animation.json' || '{your-cdn-url}/image.png'
                   }
        })
```
> see more about lottie at: https://lottiefiles.com/

**Model 1 DOM structure:**

```html
<div id="jooba-widget-wrapper">
    <div id="jooba-widget">
        <div id="jooba-widget-header">
            <div id="jooba-widget-current-amount">$1,000.00</div>
            <div id="jooba-widget-actions-bar">
                <button id="jooba-widget-info-button">?</button>
                <button id="jooba-widget-minimize-button">_</button>
                <button id="jooba-widget-maximize-button" hidden="true">❐</button>
                <button id="jooba-widget-close-button">X</button>
            </div>
        </div>
        <div id="jooba-widget-body">
            <div id="jooba-widget-media-wrapper">
                <div id="jooba-widget-media">
                    <svg></svg> or <img id="jooba-widget-media">
                </div>
            </div>
            <div id="jooba-widget-info-label-wrapper"></div>
        </div>
        <div id="jooba-widget-footer">
            <div id="jooba-widget-buttons-opt-wrapper">
                <button id="jooba-widget-opt-in-button">Accept</button>
                <button id="jooba-widget-opt-out-button" hidden="true">Opt Out</button>
            </div>
        </div>
    </div>
</div>
```

**Model 2 DOM structure:**

```html
<div id="jooba-widget-wrapper">
    <div id="jooba-widget">
        <div id="jooba-widget-header">
            <div id="jooba-widget-current-amount">$1,000.00</div>
        </div>
        <div id="jooba-widget-body">
            <div id="jooba-widget-media-wrapper">
                <svg></svg> or <img id="jooba-widget-media">
            </div>
            <div id="jooba-widget-info-label-wrapper"></div>
        </div>
    </div>
    <div id="jooba-widget-actions-bar">
        <button id="jooba-widget-info-button">?</button>
        <button id="jooba-widget-minimize-button">_</button>
        <button id="jooba-widget-maximize-button" hidden="true">❐</button>
        <button id="jooba-widget-close-button">X</button>
    </div>
    <div id="jooba-widget-footer">
        <div id="jooba-widget-buttons-opt-wrapper">
            <button id="jooba-widget-opt-in-button">Accept</button>
            <button id="jooba-widget-opt-out-button" hidden="true">Opt Out</button>
        </div>
    </div>
</div>
```

**Model 3 DOM structure:**

```html
<div id="jooba-widget-wrapper">
    <div id="jooba-widget">
        <div id="jooba-widget-header"></div>
        <div id="jooba-widget-body">
            <div id="jooba-widget-media-wrapper">
                <svg></svg> or <img id="jooba-widget-media">
            </div>
            <div id="jooba-widget-buttons-opt-wrapper">
                <button id="jooba-widget-opt-in-button">Accept</button>
                <button id="jooba-widget-opt-out-button" hidden="true">Opt Out</button>
            </div>
        </div>
        <div id="jooba-widget-footer">
            <div id="jooba-widget-info-label-wrapper"></div>
            <div id="jooba-widget-current-amount">$1,000.00</div>
        </div>
    </div>
    <div id="jooba-widget-actions-bar">
        <button id="jooba-widget-info-button">?</button>
        <button id="jooba-widget-minimize-button">_</button>
        <button id="jooba-widget-maximize-button" hidden="true">❐</button>
        <button id="jooba-widget-close-button">X</button>
    </div>
</div>
```


