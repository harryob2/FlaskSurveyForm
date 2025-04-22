console.log("Currency initialization script loaded");

document.addEventListener('DOMContentLoaded', function() {
  const moneyInputs = document.querySelectorAll('.money');
  
  if (moneyInputs.length > 0) {
    console.log(`Initializing AutoNumeric on ${moneyInputs.length} money input fields`);
    
    moneyInputs.forEach(el => {
      // Ensure AutoNumeric is available
      if (typeof AutoNumeric !== 'undefined') {
        new AutoNumeric(el, {
          currencySymbol: '€ ', // Euro symbol with space
          currencySymbolPlacement: 'p', // Prefix
          decimalCharacter: '.', 
          digitGroupSeparator: ',',
          decimalPlaces: 2,
          unformatOnSubmit: true // IMPORTANT: Sends raw number on form submit
        });
        console.log(`AutoNumeric initialized on ${el.id || el.name || 'unnamed input'}`);
      } else {
        console.error('AutoNumeric library not loaded.');
      }
    });
  } else {
    console.log('No money inputs found on page to initialize');
  }
}); 