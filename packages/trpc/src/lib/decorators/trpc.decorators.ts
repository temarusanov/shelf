import { createParamDecorator } from '@nestjs/common'
import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

export const Router = Reflector.createDecorator<{ alias?: string }>()

export const Query = Reflector.createDecorator<{ alias?: string }>()

export const Mutation = Reflector.createDecorator<{ alias?: string }>()

export const Subscription = Reflector.createDecorator<{ alias?: string }>()
