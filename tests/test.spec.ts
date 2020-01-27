import { expect } from "chai"
import { formatNginxConfig } from "../src/index"


const testCases = [

	{
		input: 'error_log    logs/error.log  e ;',
		expect: 'error_log logs/error.log e;',
		message: 'should remove whitespace between arguments'
	},
 
	{
		input: `
error_log 
   logs/error.log  e 
 ;`,
		expect: `
error_log logs/error.log e;`,
		message: 'should remove whitespace between arguments'
	},

	{
		input: `
http {
error_log logs/error.log   e;
}`,
		expect: `
http {
	error_log logs/error.log e;
}`,
		message: 'should indent blocks'
	},

	{
		input: `#  comment`,
		expect: `#  comment`,
		message: 'should preserve comments'
	},

	{
		input: `
user    # comment
# comment
1;`,
		expect: `
user # comment
	# comment
	1;`,
		message: 'should work with comments between statement'
	},

	{
		input: `
user
# user
# comment2
1 #   comment
; #   comment`,
		expect: `
user
	# user
	# comment2
	1 #   comment
	; #   comment`,
		message: 'should work with comments between statements'
	},

	{
		input: `
http { # comment
	el el;
}`,
		expect: `
http { # comment
	el el;
}`,
		message: 'should work with comments in block statements'
	},

	{
		input: `
http {
	el el
	# comment
;
}`,
		expect: `
http {
	el el
		# comment
		;
}`,
		message: 'should work with comments in block statements'
	},

	{
		input: `
user user;

#comment

#comment2`,
		expect: `
user user;

#comment

#comment2`,
		message: 'should display trailing comments'
	},

	{
		input: `
location / {
proxy_pass      http://127.0.0.1:8080;
}`,
		expect: `
location / {
	proxy_pass http://127.0.0.1:8080;
}`,
		message: 'should work for urls'
	},

	{
		input: `
location ~ ^/(images|javascript|js|css|flash|media|static)/  {
root    /var/www/virtual/big.server.com/htdocs;
expires 30d;
}`,
		expect: `
location ~ ^/(images|javascript|js|css|flash|media|static)/ {
	root /var/www/virtual/big.server.com/htdocs;
	expires 30d;
}`,
		message: 'should work for regex'
	},

	{
		input: `
user user;#comment`,
		expect: `
user user; #comment`,
		message: 'should work when comment touches text'
	},

	{
		input: `
resolver 1.1.1.1 1.0.0.1 [2606:4700:4700::1111] [2606:4700:4700::1001] valid=300s;`,
		expect: `
resolver 1.1.1.1
	1.0.0.1
	[2606:4700:4700::1111]
	[2606:4700:4700::1001]
	valid=300s;`,
		message: 'hard case'
	},

	{
		input: `
		listen [::]:443 ssl http2;`,
		expect: `
listen [::]:443 ssl http2;`,
		message: 'hard case'
	},

	{
		input: `
server {
}

#comment
server {
}
		`,
		expect: `
server {
}

#comment
server {
}`,
		message: 'should keep whitespace between blocks when there is comment '
	},

	{
		
		input: `#comment
user user;`,
		expect: `#comment
user user;`,
		message: 'should not trim comment on first line'
	},


	{
		
		input: `
http {
	user user;
}`,
		expect: `
http {
  user user;
}`,
		options: { indent: '  ' },
		message: 'should respect indent options'
	},

	{
		input: `
http {
	user 'Lorem ipsum dolor sit amet, consec' 'Lorem ipsum dolor sit amet, consec' 'Lorem ipsum dolor sit amet, consec';
}`,
		expect: `
http {
	user 'Lorem ipsum dolor sit amet, consec'
		'Lorem ipsum dolor sit amet, consec'
		'Lorem ipsum dolor sit amet, consec';
}`,
		message: 'should break arguments when they are to long'
	},

	{
		input: `
http {
	user 'Lorem ipsum dolor sit amet, consec'
	#comment
	
	'Lorem ipsum dolor sit amet, consec' 'Lorem ipsum dolor sit amet, consec';
}`,
		expect: `
http {
	user 'Lorem ipsum dolor sit amet, consec'
		#comment
		'Lorem ipsum dolor sit amet, consec' 'Lorem ipsum dolor sit amet, consec';
}`,
		message: 'should break arguments when they are to long'
	},

	{
		input: `
http {
	user 'Lorem ipsum dolor sit amet, consec' 'Lorem ipsum dolor sit amet, consec' 'Lorem ipsum dolor sit amet, consec'; #comment
}`,
		expect: `
http {
	user 'Lorem ipsum dolor sit amet, consec'
		'Lorem ipsum dolor sit amet, consec'
		'Lorem ipsum dolor sit amet, consec'; #comment
}`,
		message: 'should not brake comment to new line'
	},

	{
		input: `
http {
	user 'Lorem ipsum dolor sit amet, consec'
	'Lorem ipsum dolor sit amet, consec' 'Lorem ipsum dolor sit amet, consec'; # comment
}`,
		expect: `
http {
	user 'Lorem ipsum dolor sit amet, consec'
		'Lorem ipsum dolor sit amet, consec'
		'Lorem ipsum dolor sit amet, consec'; # comment
}`,
		message: 'should not brake comment to new line'
	},

	{
		input: `
http {
	user 'Lorem ipsum dolor sit amet, consec' #comment
	'Lorem ipsum dolor sit amet, consec' 'Lorem ipsum dolor sit amet, consec';   #comment
}`,
		expect: `
http {
	user 'Lorem ipsum dolor sit amet, consec' #comment
		'Lorem ipsum dolor sit amet, consec'
		'Lorem ipsum dolor sit amet, consec'; #comment
}`,
		message: 'should not brake comment to new line'
	},

	{
		input: `
http {
	user 'Lorem ipsum dolor sit amet, consec' 'Lorem ipsum dolor sit amet, consec' 'Lorem ipsum dolor sit amet, consec';
}`,
		expect: `
http {
	user 'Lorem ipsum dolor sit amet, consec' 'Lorem ipsum dolor sit amet, consec' 'Lorem ipsum dolor sit amet, consec';
}`,
		options: { maxStatementLength: 1000 },
		message: 'should respect maxStatementLength'
	},

]

describe('formatNginxConfig', () => {

	const onlyTestCase = testCases.find((x: any) => x.only)

	for (const testCase of onlyTestCase ? [onlyTestCase] : testCases) {
		it(testCase.message, () => {
			expect(formatNginxConfig(testCase.input, (testCase as any).options || {})).to.eq(testCase.expect)
		})
	}

})