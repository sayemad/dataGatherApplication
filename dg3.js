"use strict";

(function() {

  const dg = {

    // reference to the data table
    dataTable : document.getElementById('data'),

    // inputs in the data table
    dataInputs : document.querySelectorAll('#data input'),

    // readonly inputs node list (dynamic)
    lockedInputs : document.getElementById('data').getElementsByClassName('readonly'),
    
    // marked inputs node list (dynamic)
    highlightedInputs : document.getElementById('data').getElementsByClassName('marked'),

    // inputs with data (dynamic)
    inputsWithData : document.getElementById('data').getElementsByClassName('hasData'),

    // invalid inputs (dynamic)
    invalidInputs : document.getElementById('data').getElementsByClassName('invalid'),

    // buttons for mass unlocks, highlight removal, and value clearing
    clearLocksBtn : document.createElement('input'),
    clearHighlightsBtn : document.createElement('input'),
    clearDataBtn : document.createElement('input'),    

    init : function() {

      // assign listeners to the table for event delegation
      this.dataTable.addEventListener('click', this.updateCell, false);
      this.dataTable.addEventListener('focusout', this.updateCell, false);
      this.dataTable.addEventListener('input', this.validity.checkDataValidity, false);

      // retain error field appearance when reload occurs
      window.addEventListener('DOMContentLoaded', this.validity.checkDataValidityOnload, false);

      // set localStorage for locked and highlight fields on 'unload'
      document.addEventListener('visibilitychange', this.storage.storeLockedHighlightedInputs, false);

      // set up the help icon and text
      this.generateHelp();

      // set up the div with the buttons to clear locks and highlights
      this.generateClearingControls();

      // assign aria-label and title attributes
      this.generateAriaLabelsTitles();

      // read the localStorage and implement locks and highlights
      this.storage.loadLockedHighlightedInputs();

    },

    generateHelp : function() {
    
      // wrapper element for image and help box
      const wrapper = document.getElementById('helpWrapper');
      
      // code string for image and help box
      let str = '<a href="#" id="helpIcon" aria-controls="helpBox" aria-expanded="false">'
      str += '<img src="i/help.png" alt="Help"></a>';
      str += '<ul id="helpBox" class="remove">';
      str += '<li>To lock a cell (prevent edits) SHIFT + click on the cell; to unlock repeat this process.</li>';
      str += '<li>To highlight a cell ALT + click on the cell; to remove the highlight repeat the process.</li>';
      str += '<li>To clear a cell\'s value CTRL + click on the cell.</li>';
      str += '</ul>';
      wrapper.innerHTML = str;

      this.theIcon = document.getElementById('helpIcon');
      this.instructions = document.getElementById('helpBox');

      // assign click event to the Help icon
      this.theIcon.addEventListener('click', this.showHideHelp, false);
      
    },

    // toggle show/hide of the help box
    showHideHelp : function(evt) {
    
      dg.instructions.classList.toggle('remove');
      dg.theIcon.getAttribute('aria-expanded') === 'false' ? dg.theIcon.setAttribute('aria-expanded', 'true') : dg.theIcon.setAttribute('aria-expanded', 'false');
      evt.preventDefault();
    
    },
    
    // set up the div with the two buttons to clear locks and highlights
    generateClearingControls : function() {

      const container = document.createElement('div');
      container.id = 'clearingControls';
      this.clearLocksBtn.type = this.clearHighlightsBtn.type = this.clearDataBtn.type = 'button';
      this.clearLocksBtn.value = 'Unlock Cells';
      this.clearHighlightsBtn.value = 'Remove Cell Highlights';
      this.clearDataBtn.value = 'Remove All Data';
      this.clearLocksBtn.className = this.clearHighlightsBtn.className = this.clearDataBtn.className = 'hide';
      container.appendChild(this.clearLocksBtn);
      container.appendChild(this.clearHighlightsBtn);
      container.appendChild(this.clearDataBtn);
      container.addEventListener('click', this.massUpdates, false);
      document.querySelector('body').appendChild(container);
    
    },

    // remove all locks / all highlights / all data as well as the related control button
    massUpdates : function(evt) {
    
      const btn = dg.findTarget(evt, 'input', this);
      
      if (!btn) { return; }

      switch (btn.value) {

        case 'Unlock Cells' :

          while (dg.lockedInputs.length) {
            dg.lockedInputs[0].readOnly = false;
            dg.lockedInputs[0].title = '';

            // sequencing matters here - drop the input out of the node list last to avoid
            // errors related to trying to set attributes on undefined element node references
            dg.lockedInputs[0].classList.remove('readonly');
          }

          break;

        case 'Remove Cell Highlights' :

          while (dg.highlightedInputs.length) {
            dg.highlightedInputs[0].classList.remove('marked');
          }

          break;

        case 'Remove All Data' :

          while (dg.inputsWithData.length) {
            dg.inputsWithData[0].value = '';
            dg.inputsWithData[0].removeAttribute('aria-invalid');
            dg.inputsWithData[0].classList.remove('hasData','invalid');
          }
          dg.validity.checkFieldsForInvalidData();

          break;

      }

      // remove the control button
      btn.classList.toggle('hide'); 
    
    },

    generateAriaLabelsTitles : function() {

      // node list of inputs in table
      const inputs = document.querySelectorAll('#data input');

      for (const input of inputs) {

        // locate the subject
        const subject = input.parentNode.parentNode.cells[0].firstChild.nodeValue;

        // locate the measure
        const measure = dg.dataTable.rows[0].cells[input.parentNode.cellIndex].firstChild.nodeValue;

        // build the string
        const str = subject + ', ' + measure;
      
        // assign the aria-label and title
        input.setAttribute('aria-label', str);
        input.parentNode.title = str;

      }

    },
    
    updateCell : function(evt) {
    
      // reference to text input box clicked
      const textBox = dg.findTarget(evt, 'input', this);
    
      // if the click path did not involve a text input stop processing
      if (!textBox) { return; }
    
      // if the SHIFT key was pressed lock down the field or unlock the field
      if (evt.shiftKey) { 
      
        textBox.readOnly = (textBox.readOnly) ? false : true;
        textBox.classList.toggle('readonly');
        textBox.title = (textBox.title) ? '' : 'The cell is locked and cannot be edited; SHIFT + click to unlock it';
        dg.lockedInputs.length ? dg.clearLocksBtn.classList.remove('hide') : dg.clearLocksBtn.classList.add('hide');

      }
      
      // if the ALT key was pressed highlight the text input or remove its highlight
      if (evt.altKey) {

        textBox.classList.toggle('marked');
        dg.highlightedInputs.length ? dg.clearHighlightsBtn.classList.remove('hide') : dg.clearHighlightsBtn.classList.add('hide');
     
      }
      
      // if the CTRL key was pressed wipe the text input value
      if (evt.ctrlKey) {
      
        textBox.value = '';
      
      }

      if (textBox.value.length > 0) {
        textBox.classList.add('hasData');
        dg.clearDataBtn.classList.remove('hide');
      }
      else {
        textBox.classList.remove('hasData');
        dg.inputsWithData.length > 0 ? dg.clearDataBtn.classList.remove('hide') : dg.clearDataBtn.classList.add('hide');
      }
    
    },

    findTarget : function(evt, targetNode, container) {
      let currentNode = evt.target;
      while (currentNode && currentNode !== container) {  
        if (currentNode.nodeName.toLowerCase() === targetNode.toLowerCase()) { return currentNode; }
        else { currentNode = currentNode.parentNode; }
      }
      return false;
    },

    validity : {

      // reference to the submit button
      saveDataButton : document.getElementById('submitBtn'),
  
      // reference to holder for submit button and error message
      errorHolder : document.getElementById('error'),

      // check for invalid data in cases where the user refreshed the browser window 
      // and the browser retained the field data 
      checkDataValidityOnload : function() {

        let validData = true;

        for (const input of dg.dataInputs) {
      
          if (input.value && /[^0-9.]/.test(input.value)) {
            input.classList.add('invalid');
            input.setAttribute('aria-invalid','true');
            validData = false;
          }

          if (input.value.length > 0) {
            input.classList.add('hasData');
          }
      
        }

        dg.inputsWithData.length > 0 ? dg.clearDataBtn.classList.remove('hide') : dg.clearDataBtn.classList.add('hide');
        
        if (!validData) {
        
          dg.validity.showInvalidDataErrorMessage();
              
        }

      },

      checkDataValidity : function(evt) {

        // reference to the text input box where typing occurred
        const textBox = dg.findTarget(evt, 'input', this);    
        
        if (!textBox) { return; }
           
        if (textBox.value && /[^0-9.]/.test(textBox.value)) {
             
          textBox.classList.add('invalid');
          textBox.setAttribute('aria-invalid','true');
           
        }
           
        else {
           
          textBox.classList.remove('invalid');
          textBox.removeAttribute('aria-invalid');
          
        }
        
        dg.validity.checkFieldsForInvalidData();
      
      },

      // check to see if any other invalid data is found 
      // or if all invalid data has been removed
      checkFieldsForInvalidData : function() {
             
        dg.invalidInputs.length > 0 ? dg.validity.showInvalidDataErrorMessage() : dg.validity.clearInvalidDataErrorMessage();
      
      },

      // display the error message concerning invalid data and disable submit button
      showInvalidDataErrorMessage : function() {

        if (!dg.validity.saveDataButton.disabled) {

          dg.validity.saveDataButton.disabled = true;
          dg.validity.errorHolder.innerHTML = 'Saving disabled until invalid data is corrected.';

        }
       
      },

       // if there is an error message concerning invalid data remove the message 
       // and enable submit button
      clearInvalidDataErrorMessage : function() {
      
        dg.validity.saveDataButton.disabled = false;
        dg.validity.errorHolder.innerHTML = '';
     
      }

    },

    storage : {

      // hidden field for study ID
      studyIDFld : document.getElementsByName('studyID')[0],

      storeLockedHighlightedInputs : function() {

        if (document.visibilityState !== 'hidden') { return; }

        let lockedCells = '', highlightedCells = '', counter=0;

        // determine locked cells and highlighted cells
        for (const input of dg.dataInputs) {    

          if (input.classList.contains('readonly')) {
        
            lockedCells += counter + ',';
        
          }

          if (input.classList.contains('marked')) {
        
            highlightedCells += counter + ',';
        
          }

          counter++;
          
        }

        const lockedStudyID = dg.storage.studyIDFld.value + '_locked';
        localStorage.setItem(lockedStudyID, lockedCells);

        const highlightedStudyID = dg.storage.studyIDFld.value + '_highlighted';
        localStorage.setItem(highlightedStudyID, highlightedCells);

      },
      
      loadLockedHighlightedInputs : function() {

        const lockedStudyID = dg.storage.studyIDFld.value + '_locked';
        let lockedCells = localStorage.getItem(lockedStudyID);

        const highlightedStudyID = dg.storage.studyIDFld.value + '_highlighted';
        let highlightedCells = localStorage.getItem(highlightedStudyID);

        if (lockedCells) {

          // trim the trailing comma at the end of the string
          lockedCells = lockedCells.substring(0, lockedCells.lastIndexOf(','));
           
          // split on the comma to create an array
          const inputArray = lockedCells.split(',');

          // loop through the array of node list positions
          for (const index of inputArray) {
           
            const input = dg.dataInputs[index];
            input.readOnly = true;
            input.classList.add('readonly');
            input.title = 'The cell is locked and cannot be edited; SHIFT + click on the value to unlock it';
           
          }
          
          // show the 'Unlock Cells' control
          dg.clearLocksBtn.className = '';   
        
        }

        if (highlightedCells) {
           
          // trim the trailing comma at the end of the string
          highlightedCells = highlightedCells.substring(0, highlightedCells.lastIndexOf(','));

          // split on the comma to create an array         
          const inputArray = highlightedCells.split(',');
           
          // loop through the array of node list positions        
          for (const index of inputArray) {
           
            dg.dataInputs[index].classList.add('marked');
           
          }
          
          // show the 'Remove Cell Highlights' control
          dg.clearHighlightsBtn.className = '';
        
        }
      
      }

    }

  }

  dg.init();

})();