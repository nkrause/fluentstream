# FluentStream IP Fraud Detection

- Client: http://ec2-3-16-143-191.us-east-2.compute.amazonaws.com:3001/
- Server: http://ec2-3-16-143-191.us-east-2.compute.amazonaws.com:3000/

**Background:**
- A cronjob is set to run ‘update-ipsets’ (at every 55th min of the hour) on an EC2 instance and automatically download the set of blacklist IPS
- A second cronjob (on EC2) is set to run (at every 58th min of the hour) after the first, which takes all the downloaded .ipset and .netset files and concatenates them into one file, which is stored in the /public directory on the server app 
- A third cronjob (on server app) is set to run (at every 59th min of the hour) after the second cronjob, which updates the data structure IPRouter (Patricia/Radix Tree) using the file created from the second cronjob
    - https://github.com/kotarou3/node-ip-router
- Once an endpoint is called, the IP or list of IPs is checked against the populated IPRouter (which contains both single IPs and IP blocks) and the IPs that match are returned

- Endpoints: 
    - /upload (only works from client)
    - /check-ip 
        - curl -H "Accept: application/json" -H "Content-type: application/json" -X POST -d '{"ipList":["ipAddress1","ipAddress2",…"ipAddressN"]}' "http://ec2-3-16-143-191.us-east-2.compute.amazonaws.com:3000/check-ip"
        - Make a POST request with JSON input {"ipList":["ipAddress1","ipAddress2",…"ipAddressN"]}


**Timesheet:**
- Day 1:
  - 4 hours - initial research and architecting solution, setting up AWS, installing update-ipsets on EC2 and setting cronjob
  - 2 hours - initial client/server app creation, getting IPRouter (data structure) to work with file upload and displaying results on client

- Day 2:
  - 4 hours - continue work on client and server app, moving from localhost to AWS, updating cronjob, adding error checks and edge cases, and general testing
  - 2 hours - adding single IP check to client, creating endpoint on server side
  - 1 hour - benchmarking and code cleanup

- Day 3:
  - 3 hours - final refactoring/commenting, testing on AWS, uploading to git and adding README

**Benchmarking:**
- Populating IPRouter with ~900k entries after 5 runs (local): ~18.5s
- Populating IPRouter with  ~55k entries after 5 runs (aws): ~3.4s
- Note: 900k entries on AWS was causing OOM errors after about 800k so I limited the number of sources that update-ipsets pulls to just firehol sources

Search by file upload after 5 runs:
- 1k entries: 40ms (local), 253.9ms (aws)
- 5k entries: 130ms (local), 522.2ms (aws)
- 10k entries: 240ms (local), 754.6ms (aws)

Note: for searching by file upload, I found ~550 IPs to check from https://www.maxmind.com/en/high-risk-ip-sample-list. I copy/pasted the entire list multiple times to ultimately reach 10k IPs to check. This should be fine for our benchmark since we are really only trying to see the time it takes to iterate through every IP address in the file.

**TODO:**
- add automated testing
- make results table in client app prettier for longer lists
- more research on which Firehol lists would be most beneficial for phone calls
