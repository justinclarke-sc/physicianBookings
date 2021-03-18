import LightningDatatable from 'lightning/datatable';
import colorBox from './colorBox.html';

// extend lightning data table to add a new data type: colorBox
export default class dataTablePhysicians extends LightningDatatable {
   static customTypes = {
        colorBox: {
           template: colorBox,
           typeAttributes: ['alternate']
       }
   };
}