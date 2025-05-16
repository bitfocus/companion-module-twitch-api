import { CompanionHTTPRequest, CompanionHTTPResponse } from '@companion-module/base'
import TwitchInstance from './index'

interface Endpoints {
  GET: {
    [endpoint: string]: () => void | Promise<void>
  }

  POST: {
    [endpoint: string]: () => void | Promise<void>
  }

  [method: string]: {
    [endpoint: string]: () => void | Promise<void>
  }
}

/**
 * @returns HTTP Request
 * @description Creates a basic HTTP request to be used internally to call the HTTP handler functions
 */
export const defaultHTTPRequest = (): CompanionHTTPRequest => {
  return { method: 'GET', path: '', headers: {}, baseUrl: '', hostname: '', ip: '', originalUrl: '', query: {} }
}

/**
 * @param instance vMix Instance
 * @param request HTTP request
 * @returns HTTP response
 * @description Checks incoming HTTP requests to the instance for an appropriate handler or returns a 404
 */
export const httpHandler = async (instance: TwitchInstance, request: CompanionHTTPRequest): Promise<CompanionHTTPResponse> => {
  const response: CompanionHTTPResponse = {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 404, message: 'Not Found' }),
  }

  const auth = async () => {
    const generateDeviceCode = await instance.auth.generateDeviceCode()

    if (generateDeviceCode) {
      response.status = 302
      response.headers = { Location: generateDeviceCode.verification_uri }
    }
  }

	const channels = async () => {
		response.status = 200
		response.body = JSON.stringify(instance.channels, null, 2)
	}

  const tokens = () => {
    const tokens = {
      clientID: instance.auth.clientID,
      deviceCode: instance.auth.deviceCode,
      deviceCodeInterval: instance.auth.deviceCodeInterval,
      userCode: instance.auth.userCode,
      verificationURL: instance.auth.verificationURL,
      accessToken: instance.auth.accessToken,
      refreshToken: instance.auth.refreshToken,
      scopes: instance.auth.scopes,
    }

    response.status = 200
    response.body = JSON.stringify(tokens, null, 2)
  }

  const endpoints: Endpoints = {
    GET: {
      auth,
      tokens,
			channels
    },
    POST: {},
  }

  const endpoint = request.path.replace('/', '').toLowerCase()

  if (endpoints[request.method][endpoint]) {
    await endpoints[request.method][endpoint]()
  }

  return response
}
