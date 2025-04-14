"use client";
import { Button } from "@/components/ui/button";
import { signIn, useSession, signOut } from "next-auth/react";
import Image from "next/image";
import React, { useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

const Header = () => {
  const { data } = useSession();

  useEffect(() => {
    console.log(data?.user);
  }, [data]);

  return (
    <div className="p-5 shadow-sm flex justify-between">
      <div className="flex gap-8 items-center">
        <Image src="/logo.png" alt="logo" width={50} height={50} />
        <div className="md:flex items-center gap-6 hidden">
          <h2 className="hover:scale-105 hover:text-primary">Home</h2>
          <h2 className="hover:scale-105 hover:text-primary">Services</h2>
          <h2 className="hover:scale-105 hover:text-primary">About Us</h2>
        </div>
      </div>
      <div>
        {data?.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Image
                src={data?.user?.image}
                alt="profile"
                width={40}
                height={40}
                className="rounded-full"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href={"/mybooking/"}>MY booking</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => signOut()}>
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={() => signIn("descope")}>Login / Sign Up </Button>
        )}
      </div>
    </div>
  );
};

export default Header;
