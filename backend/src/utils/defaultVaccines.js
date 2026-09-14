const DEFAULT_VACCINE_BRANDS = [
  // 1. BCG
  { vaccineName: 'BCG', brandName: 'BCG Vaccine SSI', manufacturer: 'Statens Serum Institut', price: 350, inventory: 150 },
  { vaccineName: 'BCG', brandName: 'Tubervac', manufacturer: 'Serum Institute of India', price: 320, inventory: 80 },
  { vaccineName: 'BCG', brandName: 'BCG Statens', manufacturer: 'AJ Vaccines', price: 400, inventory: 45 },
  { vaccineName: 'BCG', brandName: 'BioBCG', manufacturer: 'BioCorp Pharma', price: 300, inventory: 100 },
  { vaccineName: 'BCG', brandName: 'NeoBCG', manufacturer: 'NeoHealth Labs', price: 280, inventory: 60 },

  // 2. OPV-0
  { vaccineName: 'OPV-0', brandName: 'PolioRix', manufacturer: 'GSK', price: 150, inventory: 200 },
  { vaccineName: 'OPV-0', brandName: 'Biopolio', manufacturer: 'Bharat Biotech', price: 140, inventory: 120 },
  { vaccineName: 'OPV-0', brandName: 'Monovalent OPV', manufacturer: 'Sanofi Pasteur', price: 160, inventory: 90 },
  { vaccineName: 'OPV-0', brandName: 'Oral-V0', manufacturer: 'Prime Pharma', price: 130, inventory: 110 },
  { vaccineName: 'OPV-0', brandName: 'ZeroPol', manufacturer: 'Apex Labs', price: 125, inventory: 75 },

  // 3. Hepatitis B (Birth Dose)
  { vaccineName: 'Hepatitis B (Birth Dose)', brandName: 'Engerix-B', manufacturer: 'GSK', price: 450, inventory: 130 },
  { vaccineName: 'Hepatitis B (Birth Dose)', brandName: 'Elovac B', manufacturer: 'Shantha Biotechnics', price: 400, inventory: 95 },
  { vaccineName: 'Hepatitis B (Birth Dose)', brandName: 'HepB-Vax', manufacturer: 'Merck & Co.', price: 420, inventory: 60 },
  { vaccineName: 'Hepatitis B (Birth Dose)', brandName: 'BioHepB', manufacturer: 'Alpha Biotech', price: 380, inventory: 80 },
  { vaccineName: 'Hepatitis B (Birth Dose)', brandName: 'HepSafe', manufacturer: 'LifeCare Pharma', price: 350, inventory: 50 },

  // 4. OPV-I
  { vaccineName: 'OPV-I', brandName: 'PolioRix', manufacturer: 'GSK', price: 150, inventory: 180 },
  { vaccineName: 'OPV-I', brandName: 'Biopolio', manufacturer: 'Bharat Biotech', price: 140, inventory: 110 },
  { vaccineName: 'OPV-I', brandName: 'PolioShield', manufacturer: 'Panacea Biotec', price: 155, inventory: 70 },
  { vaccineName: 'OPV-I', brandName: 'Oral-V1', manufacturer: 'Prime Pharma', price: 130, inventory: 85 },
  { vaccineName: 'OPV-I', brandName: 'P-One', manufacturer: 'Apex Labs', price: 125, inventory: 65 },

  // 5. Rotavirus-I
  { vaccineName: 'Rotavirus-I', brandName: 'Rotarix', manufacturer: 'GSK', price: 2500, inventory: 90 },
  { vaccineName: 'Rotavirus-I', brandName: 'RotaTeq', manufacturer: 'Merck & Co.', price: 2700, inventory: 60 },
  { vaccineName: 'Rotavirus-I', brandName: 'RotaShield', manufacturer: 'Wyeth', price: 2400, inventory: 30 },
  { vaccineName: 'Rotavirus-I', brandName: 'ViraRot', manufacturer: 'Nova Therapeutics', price: 2200, inventory: 50 },
  { vaccineName: 'Rotavirus-I', brandName: 'NeoRota', manufacturer: 'Genix Pharma', price: 2100, inventory: 40 },

  // 6. PCV-I
  { vaccineName: 'PCV-I', brandName: 'Prevenar 13', manufacturer: 'Pfizer', price: 4200, inventory: 110 },
  { vaccineName: 'PCV-I', brandName: 'Synflorix', manufacturer: 'GSK', price: 3800, inventory: 75 },
  { vaccineName: 'PCV-I', brandName: 'Pneumosil', manufacturer: 'Serum Institute of India', price: 3500, inventory: 50 },
  { vaccineName: 'PCV-I', brandName: 'PneumaVax', manufacturer: 'Metro Medics', price: 3200, inventory: 65 },
  { vaccineName: 'PCV-I', brandName: 'ShieldPCV', manufacturer: 'Cura Biotech', price: 3000, inventory: 45 },

  // 7. Pentavalent-I
  { vaccineName: 'Pentavalent-I', brandName: 'Pentaxim', manufacturer: 'Sanofi Pasteur', price: 2800, inventory: 140 },
  { vaccineName: 'Pentavalent-I', brandName: 'Shan5', manufacturer: 'Shantha Biotechnics', price: 2500, inventory: 100 },
  { vaccineName: 'Pentavalent-I', brandName: 'EasyFive', manufacturer: 'Panacea Biotec', price: 2400, inventory: 60 },
  { vaccineName: 'Pentavalent-I', brandName: 'PentaShield', manufacturer: 'Zenith Pharma', price: 2300, inventory: 85 },
  { vaccineName: 'Pentavalent-I', brandName: 'PentaCare', manufacturer: 'Globe Laboratories', price: 2100, inventory: 55 },

  // 8. OPV-II
  { vaccineName: 'OPV-II', brandName: 'PolioRix', manufacturer: 'GSK', price: 150, inventory: 160 },
  { vaccineName: 'OPV-II', brandName: 'Biopolio', manufacturer: 'Bharat Biotech', price: 140, inventory: 95 },
  { vaccineName: 'OPV-II', brandName: 'PolioShield', manufacturer: 'Panacea Biotec', price: 155, inventory: 65 },
  { vaccineName: 'OPV-II', brandName: 'Oral-V2', manufacturer: 'Prime Pharma', price: 130, inventory: 70 },
  { vaccineName: 'OPV-II', brandName: 'P-Two', manufacturer: 'Apex Labs', price: 125, inventory: 50 },

  // 9. Rotavirus-II
  { vaccineName: 'Rotavirus-II', brandName: 'Rotarix', manufacturer: 'GSK', price: 2500, inventory: 85 },
  { vaccineName: 'Rotavirus-II', brandName: 'RotaTeq', manufacturer: 'Merck & Co.', price: 2700, inventory: 55 },
  { vaccineName: 'Rotavirus-II', brandName: 'RotaShield', manufacturer: 'Wyeth', price: 2400, inventory: 25 },
  { vaccineName: 'Rotavirus-II', brandName: 'ViraRot', manufacturer: 'Nova Therapeutics', price: 2200, inventory: 45 },
  { vaccineName: 'Rotavirus-II', brandName: 'NeoRota', manufacturer: 'Genix Pharma', price: 2100, inventory: 35 },

  // 10. PCV-II
  { vaccineName: 'PCV-II', brandName: 'Prevenar 13', manufacturer: 'Pfizer', price: 4200, inventory: 100 },
  { vaccineName: 'PCV-II', brandName: 'Synflorix', manufacturer: 'GSK', price: 3800, inventory: 70 },
  { vaccineName: 'PCV-II', brandName: 'Pneumosil', manufacturer: 'Serum Institute of India', price: 3500, inventory: 45 },
  { vaccineName: 'PCV-II', brandName: 'PneumaVax', manufacturer: 'Metro Medics', price: 3200, inventory: 60 },
  { vaccineName: 'PCV-II', brandName: 'ShieldPCV', manufacturer: 'Cura Biotech', price: 3000, inventory: 40 },

  // 11. Pentavalent-II
  { vaccineName: 'Pentavalent-II', brandName: 'Pentaxim', manufacturer: 'Sanofi Pasteur', price: 2800, inventory: 130 },
  { vaccineName: 'Pentavalent-II', brandName: 'Shan5', manufacturer: 'Shantha Biotechnics', price: 2500, inventory: 90 },
  { vaccineName: 'Pentavalent-II', brandName: 'EasyFive', manufacturer: 'Panacea Biotec', price: 2400, inventory: 55 },
  { vaccineName: 'Pentavalent-II', brandName: 'PentaShield', manufacturer: 'Zenith Pharma', price: 2300, inventory: 75 },
  { vaccineName: 'Pentavalent-II', brandName: 'PentaCare', manufacturer: 'Globe Laboratories', price: 2100, inventory: 50 },

  // 12. OPV-III
  { vaccineName: 'OPV-III', brandName: 'PolioRix', manufacturer: 'GSK', price: 150, inventory: 150 },
  { vaccineName: 'OPV-III', brandName: 'Biopolio', manufacturer: 'Bharat Biotech', price: 140, inventory: 85 },
  { vaccineName: 'OPV-III', brandName: 'PolioShield', manufacturer: 'Panacea Biotec', price: 155, inventory: 60 },
  { vaccineName: 'OPV-III', brandName: 'Oral-V3', manufacturer: 'Prime Pharma', price: 130, inventory: 65 },
  { vaccineName: 'OPV-III', brandName: 'P-Three', manufacturer: 'Apex Labs', price: 125, inventory: 45 },

  // 13. IPV-I
  { vaccineName: 'IPV-I', brandName: 'Imovax Polio', manufacturer: 'Sanofi Pasteur', price: 1200, inventory: 90 },
  { vaccineName: 'IPV-I', brandName: 'PolioInact', manufacturer: 'Serum Institute of India', price: 1100, inventory: 60 },
  { vaccineName: 'IPV-I', brandName: 'BioIPV', manufacturer: 'Bharat Biotech', price: 1000, inventory: 40 },
  { vaccineName: 'IPV-I', brandName: 'InactPolio', manufacturer: 'VaxCorp', price: 950, inventory: 55 },
  { vaccineName: 'IPV-I', brandName: 'SafePolio', manufacturer: 'MediPharm', price: 900, inventory: 35 },

  // 14. PCV-III
  { vaccineName: 'PCV-III', brandName: 'Prevenar 13', manufacturer: 'Pfizer', price: 4200, inventory: 95 },
  { vaccineName: 'PCV-III', brandName: 'Synflorix', manufacturer: 'GSK', price: 3800, inventory: 65 },
  { vaccineName: 'PCV-III', brandName: 'Pneumosil', manufacturer: 'Serum Institute of India', price: 3500, inventory: 40 },
  { vaccineName: 'PCV-III', brandName: 'PneumaVax', manufacturer: 'Metro Medics', price: 3200, inventory: 55 },
  { vaccineName: 'PCV-III', brandName: 'ShieldPCV', manufacturer: 'Cura Biotech', price: 3000, inventory: 35 },

  // 15. Pentavalent-III
  { vaccineName: 'Pentavalent-III', brandName: 'Pentaxim', manufacturer: 'Sanofi Pasteur', price: 2800, inventory: 120 },
  { vaccineName: 'Pentavalent-III', brandName: 'Shan5', manufacturer: 'Shantha Biotechnics', price: 2500, inventory: 80 },
  { vaccineName: 'Pentavalent-III', brandName: 'EasyFive', manufacturer: 'Panacea Biotec', price: 2400, inventory: 50 },
  { vaccineName: 'Pentavalent-III', brandName: 'PentaShield', manufacturer: 'Zenith Pharma', price: 2300, inventory: 70 },
  { vaccineName: 'Pentavalent-III', brandName: 'PentaCare', manufacturer: 'Globe Laboratories', price: 2100, inventory: 45 },

  // 16. TCV
  { vaccineName: 'TCV', brandName: 'Typbar TCV', manufacturer: 'Bharat Biotech', price: 2200, inventory: 110 },
  { vaccineName: 'TCV', brandName: 'TyphiVax', manufacturer: 'Sanofi Pasteur', price: 2000, inventory: 70 },
  { vaccineName: 'TCV', brandName: 'BioTCV', manufacturer: 'Serum Institute of India', price: 1900, inventory: 45 },
  { vaccineName: 'TCV', brandName: 'TyphoShield', manufacturer: 'Alpha Remedies', price: 1800, inventory: 60 },
  { vaccineName: 'TCV', brandName: 'TCV-Guard', manufacturer: 'NovaBio', price: 1700, inventory: 40 },

  // 17. MR-I
  { vaccineName: 'MR-I', brandName: 'Tresivac', manufacturer: 'Serum Institute of India', price: 800, inventory: 100 },
  { vaccineName: 'MR-I', brandName: 'MMR II', manufacturer: 'Merck & Co.', price: 900, inventory: 65 },
  { vaccineName: 'MR-I', brandName: 'R-Vac', manufacturer: 'Bharat Biotech', price: 750, inventory: 40 },
  { vaccineName: 'MR-I', brandName: 'Measles-Rubella', manufacturer: 'BioSafe Labs', price: 700, inventory: 55 },
  { vaccineName: 'MR-I', brandName: 'MR-Shield', manufacturer: 'Prime Health', price: 650, inventory: 35 },

  // 18. IPV-II
  { vaccineName: 'IPV-II', brandName: 'Imovax Polio', manufacturer: 'Sanofi Pasteur', price: 1200, inventory: 80 },
  { vaccineName: 'IPV-II', brandName: 'PolioInact', manufacturer: 'Serum Institute of India', price: 1100, inventory: 50 },
  { vaccineName: 'IPV-II', brandName: 'BioIPV', manufacturer: 'Bharat Biotech', price: 1000, inventory: 30 },
  { vaccineName: 'IPV-II', brandName: 'InactPolio', manufacturer: 'VaxCorp', price: 950, inventory: 45 },
  { vaccineName: 'IPV-II', brandName: 'SafePolio', manufacturer: 'MediPharm', price: 900, inventory: 25 },

  // 19. MR-II
  { vaccineName: 'MR-II', brandName: 'Tresivac', manufacturer: 'Serum Institute of India', price: 800, inventory: 90 },
  { vaccineName: 'MR-II', brandName: 'MMR II', manufacturer: 'Merck & Co.', price: 900, inventory: 60 },
  { vaccineName: 'MR-II', brandName: 'R-Vac', manufacturer: 'Bharat Biotech', price: 750, inventory: 35 },
  { vaccineName: 'MR-II', brandName: 'Measles-Rubella', manufacturer: 'BioSafe Labs', price: 700, inventory: 50 },
  { vaccineName: 'MR-II', brandName: 'MR-Shield', manufacturer: 'Prime Health', price: 650, inventory: 30 },

  // 20. DPT Booster
  { vaccineName: 'DPT Booster', brandName: 'Triple Antigen', manufacturer: 'GSK', price: 400, inventory: 70 },
  { vaccineName: 'DPT Booster', brandName: 'DPT-Bio', manufacturer: 'Bio-Labs', price: 350, inventory: 45 },
  { vaccineName: 'DPT Booster', brandName: 'BoostDPT', manufacturer: 'Apex Pharma', price: 380, inventory: 55 },
  { vaccineName: 'DPT Booster', brandName: 'DPT-Plus', manufacturer: 'Cura Labs', price: 320, inventory: 40 },
  { vaccineName: 'DPT Booster', brandName: 'Tri-Shield', manufacturer: 'Zenith Med', price: 300, inventory: 30 },

  // 21. DTaP Catch-up
  { vaccineName: 'DTaP Catch-up', brandName: 'Infanrix', manufacturer: 'GSK', price: 2500, inventory: 60 },
  { vaccineName: 'DTaP Catch-up', brandName: 'Daptacel', manufacturer: 'Sanofi Pasteur', price: 2700, inventory: 40 },
  { vaccineName: 'DTaP Catch-up', brandName: 'Tripacel', manufacturer: 'Seqirus', price: 2600, inventory: 25 },
  { vaccineName: 'DTaP Catch-up', brandName: 'DTaP-Guard', manufacturer: 'Alpha Biotech', price: 2300, inventory: 35 },
  { vaccineName: 'DTaP Catch-up', brandName: 'NeoDTaP', manufacturer: 'Nova Labs', price: 2100, inventory: 20 },

  // 22. Td Catch-up
  { vaccineName: 'Td Catch-up', brandName: 'Td-Vac', manufacturer: 'Serum Institute of India', price: 300, inventory: 70 },
  { vaccineName: 'Td Catch-up', brandName: 'Vaxigrip Td', manufacturer: 'Sanofi', price: 280, inventory: 50 },
  { vaccineName: 'Td Catch-up', brandName: 'Tetanus-Diphtheria', manufacturer: 'BioMed', price: 250, inventory: 40 },
  { vaccineName: 'Td Catch-up', brandName: 'Td-Shield', manufacturer: 'Prime Labs', price: 270, inventory: 45 },
  { vaccineName: 'Td Catch-up', brandName: 'SafeTd', manufacturer: 'Care Pharma', price: 240, inventory: 30 },

  // 23. HPV
  { vaccineName: 'HPV', brandName: 'Gardasil 9', manufacturer: 'Merck & Co.', price: 18000, inventory: 50 },
  { vaccineName: 'HPV', brandName: 'Cervarix', manufacturer: 'GSK', price: 12000, inventory: 35 },
  { vaccineName: 'HPV', brandName: 'Gardasil', manufacturer: 'Merck & Co.', price: 15000, inventory: 30 },
  { vaccineName: 'HPV', brandName: 'HPV-Shield', manufacturer: 'OncoMed Labs', price: 10000, inventory: 25 },
  { vaccineName: 'HPV', brandName: 'VaxHPV', manufacturer: 'Genix Health', price: 9500, inventory: 20 },

  // 24. Tdap
  { vaccineName: 'Tdap', brandName: 'Boostrix', manufacturer: 'GSK', price: 3200, inventory: 65 },
  { vaccineName: 'Tdap', brandName: 'Adacel', manufacturer: 'Sanofi Pasteur', price: 3400, inventory: 45 },
  { vaccineName: 'Tdap', brandName: 'Tdap-Sanofi', manufacturer: 'Sanofi', price: 3000, inventory: 40 },
  { vaccineName: 'Tdap', brandName: 'Tri-Boost', manufacturer: 'Apex Therapeutics', price: 2800, inventory: 30 },
  { vaccineName: 'Tdap', brandName: 'ShieldTdap', manufacturer: 'Cura Biotech', price: 2600, inventory: 25 },

  // 25. Td Booster
  { vaccineName: 'Td Booster', brandName: 'Td-Vac', manufacturer: 'Serum Institute of India', price: 300, inventory: 80 },
  { vaccineName: 'Td Booster', brandName: 'Vaxigrip Td', manufacturer: 'Sanofi', price: 280, inventory: 55 },
  { vaccineName: 'Td Booster', brandName: 'Tetanus-Diphtheria', manufacturer: 'BioMed', price: 250, inventory: 45 },
  { vaccineName: 'Td Booster', brandName: 'Td-Shield', manufacturer: 'Prime Labs', price: 270, inventory: 50 },
  { vaccineName: 'Td Booster', brandName: 'SafeTd', manufacturer: 'Care Pharma', price: 240, inventory: 35 },
];

export default DEFAULT_VACCINE_BRANDS;