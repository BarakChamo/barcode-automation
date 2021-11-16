from time import sleep
import argparse

parser = argparse.ArgumentParser(description='Process some integers.')
parser.add_argument('--cycle', '-c', metavar='N', type=int,
                    help='How long is each activation cycle?', default=1)
args = parser.parse_args()

while True:
  v = input('AWAITING')

  print('Begin cycle for', args.cycle, 'seconds')
  sleep(args.cycle)
  print('End cycle')