import { LightningElement, api } from 'lwc';

/* eslint-disable no-console */
/* eslint-disable vars-on-top */

export default class colorBox extends LightningElement {

    // constructors/lifecycle callbacks

        // constructor() {
            // super();
            // console.log('colorBox.constructor: called');
        // }
    
        // for methods that need to run after public variables have been instantiated
        // connectedCallback() {

            // console.log('colorBox.connectedCallback: start');

            // console.log('colorBox.connectedCallback: end');
        // }
    
        // for methods that need to run after other methods have completed
        // runs at the end of the component lifecycle
        // renderedCallback() {

            // console.log('colorBox.renderedCallback: start');

            // console.log('colorBox.renderedCallback: end');
        // }
    
    // public variables

        // the color to display
        @api color;

        // if alternate mode is set
        @api alternate;

    // public methods



    // private variables/getters/handlers

        get cssStyle() {

            // alternate between two colours
            if (this.alternate) {

                // split the colour in two
                let colors = this.color.split('|');
                let color1 = colors[0];
                let color2 = colors[1];

                return 'width: 20px; height: 20px; text-align: center; background: repeating-linear-gradient( 45deg, ' + color1 + ', ' + color1 + ' 5px, ' + color2 + ' 5px, ' + color2 + ' 10px);';
            
                // show one colour
            } else {
                return 'width: 20px; height: 20px; text-align: center; background-color: ' + this.color;
            }
        }

    // button handlers



    // helper methods



}