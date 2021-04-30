#!/usr/bin/env python3
import os
import re
import sys
import pandas as pd
import pyarrow as pa
from pyarrow import csv, feather

in_file = sys.argv[1]
in_df = csv.read_csv(in_file).to_pandas()
if 'datetime' in in_df.columns.values.tolist():
    in_df['datetime'] = pd.to_datetime(in_df.datetime, utc=True)
#out_file = re.sub(r'\.csv$', '.feather', os.path.basename(in_file))
out_file = re.sub(r'\.csv$', '.arrow', os.path.basename(in_file))
with open(out_file, 'bw') as out_f:
    #feather.write_feather(pa.Table.from_pandas(csv.read_csv(in_file).to_pandas()), out_f, compression='zstd', compression_level=15)
    feather.write_feather(pa.Table.from_pandas(csv.read_csv(in_file).to_pandas().astype({'viewerIndex': 'int32'}).astype({'size': 'int32'}).astype({'gridSize': 'int32'})), out_f, compression='uncompressed')
os.system("gzip {}".format(out_file))
print(out_file + '.gz')
