import httplib, urllib, datetime, json

headers = {"Content-type": "application/json"}
THRESHOLD = 3


# let's define a new box class that inherits from OVBox
class MyOVBox(OVBox):
    def __init__(self):
        OVBox.__init__(self)
        self.httpServ = httplib.HTTPConnection("127.0.0.1", 8080)
        self.buf0 = []
        self.buf1 = []
        self.sent0 = False
        self.sent1 = False


    # The process method will be called by openvibe on every clock tick
    def process(self):
      if len(self.input[0]):
        # we iterate over all the input chunks in the input buffer
        

        for chunkIndex in range( len(self.input[0]) ):
            # if it's a header we save it and send the output header (same as input, except it has only one channel named 'Mean'
            if(type(self.input[0][chunkIndex]) == OVStreamedMatrixHeader):
               self.output[0].append(self.input[0].pop())

            # if it's a buffer we pop it and put it in a numpy array at the right dimensions
            # We compute the mean and add the buffer in the box output buffer
            elif(type(self.input[0][chunkIndex]) == OVStreamedMatrixBuffer):
              chunk = self.input[0].pop()
              self.output[0].append(chunk)
              self.buf0.append(chunk[0])
              self.buf1.append(chunk[1])

              if len(self.buf0) > 30:
                self.buf0.pop(0)
                self.buf0.pop(1)

                mean0 = sorted(self.buf0)[len(self.buf0) / 2]
                mean1 = sorted(self.buf0)[len(self.buf0) / 2]

                if (not self.sent0) and chunk[0] >= THRESHOLD * mean0:
                  self.sent0 = True
                  print "Send package 0"

                  data = [{
                    "type": "emg_0",
                    "v1": chunk[0],
                    "v2": 0
                  }]

                  self.httpServ.connect()
                  self.httpServ.request('POST', '/emotion', json.dumps(data), headers)
                  response = self.httpServ.getresponse()
                  self.httpServ.close()
                elif self.sent0 and chunk[0] < THRESHOLD * mean0:
                  self.sent0 = False

                if (not self.sent1) and chunk[1] >= THRESHOLD * mean1:
                  self.sent1 = True
                  print "Send package 1"

                  data = [{
                    "type": "emg_1",
                    "v1": 0,
                    "v2": chunk[1]
                  }]

                  self.httpServ.connect()
                  self.httpServ.request('POST', '/emotion', json.dumps(data), headers)
                  response = self.httpServ.getresponse()
                  self.httpServ.close()
                elif self.sent1 and chunk[1] < THRESHOLD * mean1:
                  self.sent1 = False

               #print chunk
            # if it's a end-of-stream we just forward that information to the output
            elif(type(self.input[0][chunkIndex]) == OVStreamedMatrixEnd):
               self.output[0].append(self.input[0].pop())

        

# Finally, we notify openvibe that the box instance 'box' is now an instance of MyOVBox.
# Don't forget that step !!
box = MyOVBox()