import * as React from 'react'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  token: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  token,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code for {siteName}: {token}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your verification code</Heading>
        <Text style={text}>
          Thanks for signing up for{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          !
        </Text>
        <Text style={text}>
          Enter this 6-digit code in the signup screen to verify your email address (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ).
        </Text>
        <Text style={codeBox}>{token}</Text>
        <Text style={hint}>This code expires shortly. Do not share it with anyone.</Text>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#000000',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#55575d',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const link = { color: 'inherit', textDecoration: 'underline' }
const codeBox = {
  backgroundColor: '#f4f7f2',
  border: '1px solid #dbe7d4',
  borderRadius: '10px',
  color: '#102316',
  fontSize: '32px',
  fontWeight: 'bold' as const,
  letterSpacing: '8px',
  lineHeight: '1.2',
  margin: '0 0 18px',
  padding: '18px 20px',
  textAlign: 'center' as const,
}
const hint = {
  fontSize: '13px',
  color: '#6b7280',
  lineHeight: '1.5',
  margin: '0 0 24px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
