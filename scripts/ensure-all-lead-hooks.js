/**
 * Ensure ALL profiles have window.p22SubmitLead hooked into every form:
 * - handleInlineLeadSubmit (Step 2 form)
 * - exchForm (2-Way modal form)
 * - rfqForm (Fast-track RFQ form)
 */

const fs = require('fs');
const path = require('path');

const files = ['pedro.html', 'eduardo.html', 'marleni.html', 'bids.html', 'logistics.html', 'index.html'];

for (const file of files) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Hook handleInlineLeadSubmit
  // Find "localStorage.setItem('p22_expo_leads', JSON.stringify(existing));" inside handleInlineLeadSubmit
  const target1 = "localStorage.setItem('p22_expo_leads', JSON.stringify(existing));";
  const replacement1 = `localStorage.setItem('p22_expo_leads', JSON.stringify(existing));
      } catch (err) {
        console.warn('LocalStorage save failed', err);
      }

      // Live Google Sheets Leads_Vault Synchronization
      if (window.p22SubmitLead) {
        window.p22SubmitLead(lead);
      }`;

  if (!content.includes('// Live Google Sheets Leads_Vault Synchronization\n      if (window.p22SubmitLead) {\n        window.p22SubmitLead(lead);')) {
    // Regex replace to handle any whitespace around catch
    content = content.replace(
      /localStorage\.setItem\('p22_expo_leads',\s*JSON\.stringify\(existing\)\);\s*\}\s*catch\s*\(err\)\s*\{\s*console\.warn\('LocalStorage save failed',\s*err\);\s*\}/g,
      replacement1
    );
  }

  // 2. Hook exchForm submit
  const targetExch = `localStorage.setItem('p22_leads', JSON.stringify(stored));
        } catch (err) {
          console.warn('LocalStorage save failed', err);
        }

        // Live Google Sheets Leads_Vault Synchronization
        if (window.p22SubmitLead) {
          window.p22SubmitLead(lead);
        }`;

  if (!content.includes('// Live Google Sheets Leads_Vault Synchronization\n        if (window.p22SubmitLead) {\n          window.p22SubmitLead(lead);')) {
    content = content.replace(
      /localStorage\.setItem\('p22_leads',\s*JSON\.stringify\(stored\)\);\s*\}\s*catch\s*\(err\)\s*\{\s*console\.warn\('LocalStorage save failed',\s*err\);\s*\}\s*const submitBtn = document\.getElementById\('exchSubmitBtn'\);/g,
      `${targetExch}\n\n        const submitBtn = document.getElementById('exchSubmitBtn');`
    );
  }

  // 3. Hook rfqForm submit
  const targetRfq = `localStorage.setItem('p22_leads', JSON.stringify(stored));
      } catch (err) {
        console.warn('LocalStorage save failed', err);
      }

      // Live Google Sheets Leads_Vault Synchronization
      if (window.p22SubmitLead) {
        window.p22SubmitLead(leadData);
      }`;

  if (!content.includes('// Live Google Sheets Leads_Vault Synchronization\n      if (window.p22SubmitLead) {\n        window.p22SubmitLead(leadData);')) {
    content = content.replace(
      /localStorage\.setItem\('p22_leads',\s*JSON\.stringify\(stored\)\);\s*\}\s*catch\s*\(err\)\s*\{\s*console\.warn\('LocalStorage save failed',\s*err\);\s*\}\s*try\s*\{\s*if\s*\(!MAKE_WEBHOOK_URL/g,
      `${targetRfq}\n\n      try {\n        if (!MAKE_WEBHOOK_URL`
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');

  // Verify
  const updated = fs.readFileSync(filePath, 'utf8');
  const count = (updated.match(/window\.p22SubmitLead/g) || []).length;
  console.log(`[+] ${file}: window.p22SubmitLead occurrences = ${count}`);
}
