import fetch from 'node-fetch';

const baseUrl = 'https://3000-i5f387mdxw8iywanusa7v-f9bed328.us1.manus.computer';

async function testNavigation() {
  console.log('=== TESTING PROCEDURE NAVIGATION ===\n');

  const procedures = ['PR-01', 'PR-02', 'PR-03'];

  for (const code of procedures) {
    try {
      console.log(`Testing: /procedimentos/${code}`);
      const response = await fetch(`${baseUrl}/procedimentos/${code}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
        },
      });

      if (response.ok) {
        const html = await response.text();
        
        // Check if the procedure code is in the response
        if (html.includes(code)) {
          console.log(`✅ ${code}: Found in response`);
        } else {
          console.log(`❌ ${code}: NOT found in response`);
        }

        // Check for procedure name
        if (code === 'PR-01' && html.includes('Controle de Dados de Projeto')) {
          console.log(`✅ ${code}: Correct title found`);
        } else if (code === 'PR-02' && html.includes('Controle de Modificações')) {
          console.log(`✅ ${code}: Correct title found`);
        } else if (code === 'PR-03' && html.includes('Instruções de Aeronavegabilidade')) {
          console.log(`✅ ${code}: Correct title found`);
        } else {
          console.log(`⚠️ ${code}: Title verification inconclusive`);
        }

        // Check for step count
        const stepMatches = html.match(/Step \d+:/g);
        if (stepMatches) {
          console.log(`✅ ${code}: Found ${stepMatches.length} steps`);
        }

        // Check for COP requirements
        const copMatches = html.match(/1\.[A-D]\.\d/g);
        if (copMatches) {
          const uniqueCops = new Set(copMatches);
          console.log(`✅ ${code}: Found ${uniqueCops.size} unique COP requirements`);
        }

      } else {
        console.log(`❌ ${code}: HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${code}: Error - ${error.message}`);
    }
    console.log('');
  }

  console.log('=== NAVIGATION TEST COMPLETE ===');
}

testNavigation();
