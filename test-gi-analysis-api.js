/**
 * Test script for Gastroenterology Panel (GIP) and GI-MAP Analysis API
 * Tests comprehensive GI analysis capabilities including microbiome profiling
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Sample GI lab values for testing
const sampleGILabValues = [
  {
    testName: 'Calprotectin',
    value: '180',
    unit: 'μg/g',
    referenceRange: '<50 μg/g',
    abnormalFlag: 'H',
    criticalFlag: false,
    testCode: 'CALP',
    category: 'Inflammatory Markers'
  },
  {
    testName: 'Lactoferrin',
    value: '12.5',
    unit: 'μg/g',
    referenceRange: '<7.25 μg/g',
    abnormalFlag: 'H',
    criticalFlag: false,
    testCode: 'LACF',
    category: 'Inflammatory Markers'
  },
  {
    testName: 'Pancreatic Elastase',
    value: '85',
    unit: 'μg/g',
    referenceRange: '>200 μg/g',
    abnormalFlag: 'L',
    criticalFlag: false,
    testCode: 'ELAS',
    category: 'Digestive Enzymes'
  },
  {
    testName: 'Zonulin',
    value: '125',
    unit: 'ng/mL',
    referenceRange: '<107 ng/mL',
    abnormalFlag: 'H',
    criticalFlag: false,
    testCode: 'ZONU',
    category: 'Intestinal Permeability'
  },
  {
    testName: 'Secretory IgA',
    value: '420',
    unit: 'μg/mL',
    referenceRange: '510-2010 μg/mL',
    abnormalFlag: 'L',
    criticalFlag: false,
    testCode: 'SIGA',
    category: 'Immune Function'
  },
  {
    testName: 'Lactobacillus spp.',
    value: '8.5e5',
    unit: 'CFU/g',
    referenceRange: '1e6-1e8 CFU/g',
    abnormalFlag: 'L',
    criticalFlag: false,
    testCode: 'LACTO',
    category: 'Beneficial Bacteria'
  },
  {
    testName: 'Candida albicans',
    value: '2.1e4',
    unit: 'CFU/g',
    referenceRange: '<1e3 CFU/g',
    abnormalFlag: 'H',
    criticalFlag: false,
    testCode: 'CAND',
    category: 'Pathogenic Organisms'
  }
];

// Sample patient context for GI analysis
const samplePatientContext = {
  symptoms: [
    'abdominal pain',
    'diarrhea',
    'bloating',
    'fatigue',
    'weight loss'
  ],
  medicalHistory: [
    'family history of IBD',
    'previous antibiotic use'
  ],
  currentMedications: [
    'omeprazole'
  ],
  dietaryHistory: [
    'high processed food intake',
    'low fiber diet',
    'frequent alcohol consumption'
  ]
};

async function testGIAnalysisAPI() {
  console.log('🦠 Testing Gastroenterology Panel (GIP) & GI-MAP Analysis API...\n');

  try {
    // Test 1: Comprehensive GI Analysis
    console.log('📋 Test 1: Comprehensive GI Analysis');
    const giAnalysisResponse = await axios.post(`${BASE_URL}/api/gi-analysis`, {
      patientId: 1,
      testType: 'comprehensive',
      labValues: sampleGILabValues,
      patientSymptoms: samplePatientContext.symptoms,
      medicalHistory: samplePatientContext.medicalHistory,
      currentMedications: samplePatientContext.currentMedications,
      dietaryHistory: samplePatientContext.dietaryHistory
    });

    console.log('✅ GI Analysis Response:');
    console.log(`   - Analysis Providers: ${giAnalysisResponse.data.length}`);
    
    giAnalysisResponse.data.forEach((analysis, index) => {
      console.log(`   - Provider ${index + 1} (${analysis.aiProvider}):`);
      console.log(`     * Analysis Type: ${analysis.analysisType}`);
      console.log(`     * Urgency Level: ${analysis.urgencyLevel}`);
      console.log(`     * Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
      console.log(`     * Primary Findings: ${analysis.clinicalFindings.primaryFindings.length}`);
      console.log(`     * Differential Diagnoses: ${analysis.differentialDiagnoses.length}`);
      console.log(`     * Processing Time: ${analysis.processingTime}ms`);
    });
    console.log('');

    // Test 2: Inflammatory Markers Focus
    console.log('📋 Test 2: Inflammatory Markers Focused Analysis');
    const inflammatoryResponse = await axios.post(`${BASE_URL}/api/gi-analysis`, {
      patientId: 1,
      testType: 'gip',
      labValues: sampleGILabValues.filter(v => v.category === 'Inflammatory Markers'),
      patientSymptoms: ['abdominal pain', 'diarrhea'],
      medicalHistory: ['family history of IBD']
    });

    console.log('✅ Inflammatory Analysis Response:');
    inflammatoryResponse.data.forEach((analysis, index) => {
      console.log(`   - Provider ${index + 1}: ${analysis.inflammatoryMarkers.length} markers analyzed`);
      analysis.inflammatoryMarkers.forEach(marker => {
        console.log(`     * ${marker.testName}: ${marker.value} ${marker.unit} (${marker.status})`);
      });
    });
    console.log('');

    // Test 3: Microbiome Focused Analysis
    console.log('📋 Test 3: Microbiome Focused Analysis (GI-MAP)');
    const microbiomeResponse = await axios.post(`${BASE_URL}/api/gi-analysis`, {
      patientId: 1,
      testType: 'gi_map',
      labValues: sampleGILabValues.filter(v => 
        v.category === 'Beneficial Bacteria' || v.category === 'Pathogenic Organisms'
      ),
      patientSymptoms: ['bloating', 'irregular bowel movements'],
      dietaryHistory: ['high processed food intake', 'low fiber diet']
    });

    console.log('✅ Microbiome Analysis Response:');
    microbiomeResponse.data.forEach((analysis, index) => {
      console.log(`   - Provider ${index + 1}: Microbiome Profile`);
      console.log(`     * Diversity Status: ${analysis.microbiomeProfile.bacterialDiversity.diversityStatus}`);
      console.log(`     * Shannon Index: ${analysis.microbiomeProfile.bacterialDiversity.shannonIndex}`);
      console.log(`     * Beneficial Bacteria: ${analysis.microbiomeProfile.beneficialBacteria.length} species`);
      console.log(`     * Pathogenic Organisms: ${analysis.microbiomeProfile.pathogenicOrganisms.length} detected`);
    });
    console.log('');

    // Test 4: Treatment Recommendations
    console.log('📋 Test 4: Treatment Recommendations Analysis');
    const firstAnalysis = giAnalysisResponse.data[0];
    console.log('✅ Treatment Recommendations:');
    console.log(`   - Dietary: ${firstAnalysis.treatmentRecommendations.dietary.length} recommendations`);
    firstAnalysis.treatmentRecommendations.dietary.forEach((rec, i) => {
      console.log(`     ${i + 1}. ${rec}`);
    });
    
    console.log(`   - Supplements: ${firstAnalysis.treatmentRecommendations.supplements.length} recommendations`);
    firstAnalysis.treatmentRecommendations.supplements.forEach((rec, i) => {
      console.log(`     ${i + 1}. ${rec}`);
    });
    
    console.log(`   - Medical: ${firstAnalysis.treatmentRecommendations.medical.length} recommendations`);
    firstAnalysis.treatmentRecommendations.medical.forEach((rec, i) => {
      console.log(`     ${i + 1}. ${rec}`);
    });
    console.log('');

    // Test 5: Differential Diagnoses
    console.log('📋 Test 5: Differential Diagnoses Analysis');
    console.log('✅ Differential Diagnoses:');
    firstAnalysis.differentialDiagnoses.forEach((diagnosis, index) => {
      console.log(`   ${index + 1}. ${diagnosis.condition}`);
      console.log(`      - Probability: ${(diagnosis.probability * 100).toFixed(1)}%`);
      console.log(`      - Supporting Evidence: ${diagnosis.supportingEvidence.length} factors`);
      console.log(`      - Additional Tests: ${diagnosis.additionalTestsNeeded.length} recommended`);
    });
    console.log('');

    // Test 6: Critical Values Detection
    console.log('📋 Test 6: Critical Values and Urgency Assessment');
    const criticalLabValues = [
      {
        testName: 'Calprotectin',
        value: '850',
        unit: 'μg/g',
        referenceRange: '<50 μg/g',
        abnormalFlag: 'H',
        criticalFlag: true,
        testCode: 'CALP',
        category: 'Inflammatory Markers'
      }
    ];

    const criticalResponse = await axios.post(`${BASE_URL}/api/gi-analysis`, {
      patientId: 1,
      testType: 'comprehensive',
      labValues: criticalLabValues,
      patientSymptoms: ['severe abdominal pain', 'bloody diarrhea', 'fever']
    });

    console.log('✅ Critical Values Analysis:');
    criticalResponse.data.forEach((analysis, index) => {
      console.log(`   - Provider ${index + 1}: Urgency Level = ${analysis.urgencyLevel}`);
      console.log(`   - Primary Findings: ${analysis.clinicalFindings.primaryFindings.join('; ')}`);
    });
    console.log('');

    // Test 7: Integration with Standard Lab Analysis
    console.log('📋 Test 7: Integration with Standard Lab Analysis');
    const mixedLabValues = [
      ...sampleGILabValues.slice(0, 3),
      {
        testName: 'Hemoglobin',
        value: '10.2',
        unit: 'g/dL',
        referenceRange: '12.0-15.5 g/dL',
        abnormalFlag: 'L',
        criticalFlag: false,
        testCode: 'HGB',
        category: 'CBC'
      }
    ];

    const mixedResponse = await axios.post(`${BASE_URL}/api/lab-analysis`, {
      labValues: mixedLabValues,
      patientAge: 35,
      patientGender: 'female',
      reportDate: new Date().toISOString(),
      laboratoryName: 'Test Lab'
    });

    console.log('✅ Mixed Analysis Response:');
    console.log(`   - Analysis detected GI markers: ${mixedResponse.data.length > 0}`);
    console.log(`   - Specialized GI analysis triggered: ${mixedResponse.data.some(a => a.analysisType.includes('gi'))}`);
    console.log('');

    console.log('🎉 All GI Analysis API tests completed successfully!');

  } catch (error) {
    console.error('❌ GI Analysis API test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('\n💡 Note: Make sure the GI analysis endpoints are implemented in the server routes.');
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Note: Make sure the development server is running on port 5000.');
      console.log('   Run: npm run dev:win (Windows) or npm run dev (Linux/Mac)');
    }
  }
}

// Additional test for GI-MAP specific features
async function testGIMAPFeatures() {
  console.log('\n🧬 Testing GI-MAP Specific Features...\n');

  const gimapLabValues = [
    {
      testName: 'Bacterial Diversity Index',
      value: '2.8',
      unit: 'Shannon Index',
      referenceRange: '>3.0',
      abnormalFlag: 'L',
      testCode: 'SHAN',
      category: 'Microbiome Diversity'
    },
    {
      testName: 'Akkermansia muciniphila',
      value: '1.2e5',
      unit: 'CFU/g',
      referenceRange: '1e5-1e7 CFU/g',
      abnormalFlag: null,
      testCode: 'AKKER',
      category: 'Beneficial Bacteria'
    },
    {
      testName: 'vanA Gene',
      value: 'Detected',
      unit: 'Qualitative',
      referenceRange: 'Not Detected',
      abnormalFlag: 'H',
      testCode: 'VANA',
      category: 'Antibiotic Resistance'
    }
  ];

  try {
    const gimapResponse = await axios.post(`${BASE_URL}/api/gi-analysis`, {
      patientId: 1,
      testType: 'gi_map',
      labValues: gimapLabValues,
      patientSymptoms: ['dysbiosis symptoms'],
      medicalHistory: ['recent antibiotic use']
    });

    console.log('✅ GI-MAP Specific Analysis:');
    gimapResponse.data.forEach((analysis, index) => {
      console.log(`   - Provider ${index + 1}:`);
      console.log(`     * Antibiotic Resistance Genes: ${analysis.microbiomeProfile.antibioticResistanceGenes.length} detected`);
      analysis.microbiomeProfile.antibioticResistanceGenes.forEach(gene => {
        console.log(`       - ${gene.gene}: ${gene.detected ? 'Detected' : 'Not Detected'}`);
        console.log(`         Clinical Implication: ${gene.clinicalImplication}`);
      });
    });

  } catch (error) {
    console.error('❌ GI-MAP test failed:', error.response?.data || error.message);
  }
}

// Run all tests
async function runAllTests() {
  await testGIAnalysisAPI();
  await testGIMAPFeatures();
}

// Execute tests if run directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testGIAnalysisAPI,
  testGIMAPFeatures,
  runAllTests
};
