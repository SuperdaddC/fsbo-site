// FSBO vs Listed Calculator
(function(){
  const slider = document.getElementById('homeValueSlider');
  const display = document.getElementById('homeValueDisplay');
  if(!slider) return;

  const commissionRate = 0.05; // 5% total commission
  const fsboDiscount = 0.23;   // FSBO sells 23% less on avg

  function formatCurrency(n){
    return '$'+n.toLocaleString('en-US',{maximumFractionDigits:0});
  }

  function calculate(){
    const val = parseInt(slider.value);
    display.textContent = formatCurrency(val);

    // Estimated sale prices
    const listedPrice = val;
    const fsboPrice = Math.round(val * (1 - fsboDiscount));

    // Net proceeds
    const listedNet = Math.round(listedPrice - (listedPrice * commissionRate));
    const fsboNet = fsboPrice; // no commission but lower price

    const diff = listedNet - fsboNet;

    // Update cards
    const el = (id) => document.getElementById(id);
    el('fsboSalePrice').textContent = formatCurrency(fsboPrice);
    el('listedSalePrice').textContent = formatCurrency(listedPrice);
    el('fsboNet').textContent = formatCurrency(fsboNet);
    el('listedNet').textContent = formatCurrency(listedNet);
    el('listedCommission').textContent = formatCurrency(Math.round(listedPrice * commissionRate));
    el('netDifference').textContent = formatCurrency(Math.abs(diff));
    el('diffDirection').textContent = diff > 0 ? 'more' : 'less';

    // Bar chart
    const maxVal = Math.max(listedNet, fsboNet);
    const fsboPct = (fsboNet / maxVal * 100).toFixed(1);
    const listedPct = (listedNet / maxVal * 100).toFixed(1);
    el('fsboBar').style.width = fsboPct + '%';
    el('fsboBar').textContent = formatCurrency(fsboNet);
    el('listedBar').style.width = listedPct + '%';
    el('listedBar').textContent = formatCurrency(listedNet);

    // Days on market
    el('fsboDays').textContent = '~68 days';
    el('listedDays').textContent = '~47 days';
  }

  slider.addEventListener('input', calculate);
  calculate();
})();

// Home Worth Estimator (form-based for now)
(function(){
  const form = document.getElementById('worthForm');
  if(!form) return;

  form.addEventListener('submit', function(e){
    e.preventDefault();
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());

    // For now, show a confirmation and simulate
    const sqft = parseInt(data.sqft) || 1500;
    const beds = parseInt(data.beds) || 3;
    const baths = parseInt(data.baths) || 2;

    // Very rough estimate based on CA median price/sqft (~$350-450/sqft)
    const lowPsf = 300;
    const highPsf = 450;
    const bedAdj = (beds - 3) * 15000;
    const bathAdj = (baths - 2) * 10000;
    const lowEst = Math.round((sqft * lowPsf + bedAdj + bathAdj) / 1000) * 1000;
    const highEst = Math.round((sqft * highPsf + bedAdj + bathAdj) / 1000) * 1000;

    const result = document.getElementById('worthResult');
    result.style.display = 'block';
    document.getElementById('worthLow').textContent = '$' + lowEst.toLocaleString();
    document.getElementById('worthHigh').textContent = '$' + highEst.toLocaleString();
    document.getElementById('worthNote').style.display = 'block';

    // Also trigger form submission to Netlify/email
    if(typeof handleFormSubmit === 'function'){
      handleFormSubmit('worth-estimate', data);
    }
  });
})();
