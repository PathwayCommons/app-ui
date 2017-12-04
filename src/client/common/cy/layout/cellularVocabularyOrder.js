// Not currently used but might be worked on in the future

const ontologyOrderMap = new Map()
.set('extracellular_region', 0)
.set('plasma_membrane', 1)
.set('cytoplasm', 2)
.set('cytosol', 3)
.set('Cytosol', 3)
.set('integral_to_membrane', 4)
.set('membrane_raft', 5)
.set('endosome', 7)
.set('early_endosome_membrane', 6)
.set('late_endosome', 8)
.set('nucleus', 9)
.set('Nucleoplasm', 10)
.set('mitochondria', 11)
.set('mitochondrial_outer_membrane', 12)
.set('mitochondrial_inner_membrane', 13)
.set('mitochondrial matrix', 14)
.set('golgi_apparatus', 15)
.set('peroxisome_membrane', 16);

const cellularVocabularyOrder = (ontologyLabel) => ontologyOrderMap.get(ontologyLabel);

module.exports = cellularVocabularyOrder;
