#!/bin/python

from os import listdir
from os.path import isfile, join
import json

def generate_pathway_links_from_sbgn_files(sbgn_dir):
  onlyfiles = [ f for f in listdir(sbgn_dir) if isfile(join(sbgn_dir, f))]

  processed_names = []
  for raw_fname in onlyfiles:
    processed_name = 'http://' + raw_fname.split('___')[1].replace('_', '/').replace('.xml', '')

    if not processed_name.startswith('http://pathwaycommons.org/pc2/'):
      processed_names.append(processed_name)
  return json.dumps(processed_names)


pathway_links = generate_pathway_links_from_sbgn_files('./pathways')
print pathway_links